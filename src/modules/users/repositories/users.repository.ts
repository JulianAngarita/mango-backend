import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../../supabase/supabase.service';
import { ProfileRow } from '../../../supabase/supabase.types';
import { CreateUserDto } from '../dtos/create-users.dto';
import { UpdateUserDto, UpdateUserAdminDto } from '../dtos/update-users.dto';
import { UserFilterDto } from '../dtos/user-filter.dto';
import { EncryptionService } from '@modules/encryption/encryption.service';

/**
 * Campos del perfil que se cifran en BD con AES-256-GCM.
 * Fuente de verdad — usada en encrypt y decrypt.
 */
const ENCRYPTED_FIELDS = [
  'full_name',
  'phone',
  'address',
  'birth_date',
  'bio',
] as const;

export interface PaginatedUsers {
  data: Partial<ProfileRow>[];
  total: number;
  page: number;
  limit: number;
}

/**
 * UsersRepository — acceso a datos de la tabla profiles.
 *
 * Responsabilidades:
 *   - Todas las queries a Supabase sobre profiles
 *   - Cifrar antes de escribir / descifrar después de leer
 *   - Nunca lanza excepciones de negocio — devuelve null o lanza errores de BD
 *
 * El servicio es quien lanza NotFoundException, ForbiddenException, etc.
 */
@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly encryption: EncryptionService,
  ) {}

  // ── Lectura ──────────────────────────────────────────────────────────────

  async findById(id: string): Promise<ProfileRow | null> {
    const { data, error } = await this.supabase
      .getClient()
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      this.logger.error(`findById error: ${error.message}`);
      return null;
    }

    return data ? this.decrypt(data as unknown as ProfileRow) : null;
  }

  async findByEmailHash(email: string): Promise<ProfileRow | null> {
    const emailHash = this.encryption.hashForSearch(email);
    const { data, error } = await this.supabase
      .getClient()
      .from('profiles')
      .select('*')
      .eq('email_hash' as any, emailHash)
      .maybeSingle();

    if (error) {
      this.logger.error(`findByEmailHash error: ${error.message}`);
      return null;
    }

    return data ? this.decrypt(data as unknown as ProfileRow) : null;
  }

  async findPublicById(id: string): Promise<Partial<ProfileRow> | null> {
    const { data, error } = await this.supabase
      .getClient()
      .from('profiles')
      .select('id, full_name, avatar_url, bio, plan, xp_total, level, current_streak, longest_streak')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;

    const row = data as any;
    return {
      ...row,
      full_name: this.encryption.decrypt(row.full_name),
      bio: this.encryption.decrypt(row.bio),
    };
  }

  async findByGymId(gymId: string, filter: UserFilterDto): Promise<PaginatedUsers> {
    const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc', role } = filter;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .getClient()
      .from('profiles')
      .select('id, full_name, avatar_url, email, role, plan, xp_total, level, created_at', { count: 'exact' })
      .eq('gym_id', gymId);

    if (role) query = query.eq('role', role);

    query = query
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      this.logger.error(`findByGymId error: ${error.message}`);
      return { data: [], total: 0, page, limit };
    }

    const decrypted = (data ?? []).map((u) => {
      const row = u as any;
      return {
        ...row,
        full_name: this.encryption.decrypt(row.full_name as string | null),
      };
    });

    // Filtro por nombre en memoria (no podemos hacer LIKE sobre datos cifrados)
    const filtered = filter.search
      ? decrypted.filter((u) =>
          u.full_name?.toLowerCase().includes(filter.search!.toLowerCase()),
        )
      : decrypted;

    return {
      data: filtered,
      total: count ?? 0,
      page,
      limit,
    };
  }

  // ── Escritura ────────────────────────────────────────────────────────────

  async create(dto: CreateUserDto, userId: string): Promise<ProfileRow | null> {
    const payload = this.buildEncryptedPayload(dto);

    const { data, error } = await (this.supabase.getClient() as any)
      .from('profiles')
      .insert({
        id: userId,
        email: dto.email,
        email_hash: this.encryption.hashForSearch(dto.email),
        role: dto.role ?? 'user',
        gym_id: dto.gym_id ?? null,
        ...payload,
      })
      .select('*')
      .single();

    if (error) {
      this.logger.error(`create error: ${error.message}`);
      return null;
    }

    return this.decrypt(data as unknown as ProfileRow);
  }

  async update(id: string, dto: UpdateUserDto | UpdateUserAdminDto): Promise<ProfileRow | null> {
    const payload = this.buildEncryptedPayload(dto);

    // Campos admin (no cifrados)
    if ('role' in dto && dto.role) (payload as any).role = dto.role;
    if ('gym_id' in dto && dto.gym_id !== undefined) (payload as any).gym_id = dto.gym_id;

    // FCM token no se cifra (es un token opaco de Firebase)
    if (dto.fcm_token !== undefined) (payload as any).fcm_token = dto.fcm_token;

    const { data, error } = await (this.supabase.getClient() as any)
      .from('profiles')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      this.logger.error(`update error: ${error.message}`);
      return null;
    }

    return this.decrypt(data as unknown as ProfileRow);
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<ProfileRow | null> {
    const { data, error } = await (this.supabase.getClient() as any)
      .from('profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      this.logger.error(`updateAvatar error: ${error.message}`);
      return null;
    }

    return this.decrypt(data as unknown as ProfileRow);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .getClient()
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`delete error: ${error.message}`);
      return false;
    }

    return true;
  }

  async emailExists(email: string): Promise<boolean> {
    const emailHash = this.encryption.hashForSearch(email);
    const { data } = await this.supabase
      .getClient()
      .from('profiles')
      .select('id')
      .eq('email_hash' as any, emailHash)
      .maybeSingle();

    return !!data;
  }

  // ── Helpers privados ─────────────────────────────────────────────────────

  /** Descifra todos los campos sensibles de una fila */
  private decrypt(row: ProfileRow): ProfileRow {
    const result = { ...row } as any;
    for (const field of ENCRYPTED_FIELDS) {
      if (result[field] !== null && result[field] !== undefined) {
        result[field] = this.encryption.decrypt(result[field] as string);
      }
    }
    return result as ProfileRow;
  }

  /** Construye el payload de insert/update cifrando los campos sensibles */
  private buildEncryptedPayload(dto: UpdateUserDto): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    if (dto.full_name !== undefined)
      payload['full_name'] = this.encryption.encrypt(dto.full_name);

    if (dto.phone !== undefined)
      payload['phone'] = dto.phone ? this.encryption.encrypt(dto.phone) : null;

    if (dto.address !== undefined)
      payload['address'] = dto.address ? this.encryption.encrypt(dto.address) : null;

    if (dto.birth_date !== undefined)
      payload['birth_date'] = dto.birth_date ? this.encryption.encrypt(dto.birth_date) : null;

    if (dto.bio !== undefined)
      payload['bio'] = dto.bio ? this.encryption.encrypt(dto.bio) : null;

    if (dto.avatar_url !== undefined)
      payload['avatar_url'] = dto.avatar_url;

    return payload;
  }
}