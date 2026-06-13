import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../../../supabase/supabase.service';
import { UsersRepository, PaginatedUsers } from '../repositories/users.repository';
import { CreateUserDto } from '../dtos/create-users.dto';
import { UpdateUserDto, UpdateUserAdminDto } from '../dtos/update-users.dto';
import { UserFilterDto } from '../dtos/user-filter.dto';
import { ProfileRow } from '../../../supabase/supabase.types';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly repo: UsersRepository,
    private readonly supabase: SupabaseService,
  ) {}

  // ── Perfil propio ────────────────────────────────────────────────────────

  async getMyProfile(userId: string): Promise<ProfileRow> {
    const profile = await this.repo.findById(userId);
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    return profile;
  }

  async updateMyProfile(userId: string, dto: UpdateUserDto): Promise<ProfileRow> {
    const updated = await this.repo.update(userId, dto);
    if (!updated) throw new NotFoundException('No se pudo actualizar el perfil');
    return updated;
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<ProfileRow> {
    const updated = await this.repo.updateAvatar(userId, avatarUrl);
    if (!updated) throw new NotFoundException('No se pudo actualizar el avatar');
    return updated;
  }

  async deleteMyAccount(userId: string): Promise<void> {
    await this.repo.delete(userId);

    const { error } = await this.supabase
      .getClient()
      .auth.admin.deleteUser(userId);

    if (error) {
      this.logger.error(`Error eliminando usuario de Auth: ${error.message}`);
    }

    this.logger.log(`Cuenta eliminada: ${userId}`);
  }

  // ── Perfil público ───────────────────────────────────────────────────────

  async getPublicProfile(userId: string): Promise<Partial<ProfileRow>> {
    const profile = await this.repo.findPublicById(userId);
    if (!profile) throw new NotFoundException('Usuario no encontrado');
    return profile;
  }

  // ── Búsqueda por email (uso interno) ────────────────────────────────────

  async findByEmail(email: string): Promise<ProfileRow | null> {
    return this.repo.findByEmailHash(email);
  }

  // ── CRM — Gestión de usuarios ────────────────────────────────────────────

  /**
   * Crear usuario desde el CRM (registro exprés en recepción — C04).
   * Si viene password, crea cuenta en Supabase Auth.
   * Si no, crea solo el perfil y envía invitación por email.
   */
  async createUser(dto: CreateUserDto, requestingUser: ProfileRow): Promise<ProfileRow> {
    this.assertCanManageGym(requestingUser, dto.gym_id);

    const exists = await this.repo.emailExists(dto.email);
    if (exists) throw new ConflictException('Este email ya está registrado');

    let userId: string;

    if (dto.password) {
      // Crear cuenta completa en Supabase Auth
      const { data, error } = await this.supabase
        .getClient()
        .auth.admin.createUser({
          email: dto.email,
          password: dto.password,
          email_confirm: true,
          user_metadata: { full_name: dto.full_name },
        });

      if (error || !data.user) {
        this.logger.error('Error creando usuario en Auth', error);
        throw new InternalServerErrorException('Error al crear el usuario');
      }

      userId = data.user.id;
    } else {
      // Invitar por email — Supabase envía magic link
      const { data, error } = await this.supabase
        .getClient()
        .auth.admin.inviteUserByEmail(dto.email, {
          data: { full_name: dto.full_name },
        });

      if (error || !data.user) {
        this.logger.error('Error enviando invitación', error);
        throw new InternalServerErrorException('Error al enviar la invitación');
      }

      userId = data.user.id;
    }

    const profile = await this.repo.create(dto, userId);

    if (!profile) {
      await this.supabase.getClient().auth.admin.deleteUser(userId);
      throw new InternalServerErrorException('Error al crear el perfil');
    }

    this.logger.log(`Usuario creado desde CRM: ${userId} por ${requestingUser.id}`);
    return profile;
  }

  async updateUser(
    targetId: string,
    dto: UpdateUserAdminDto,
    requestingUser: ProfileRow,
  ): Promise<ProfileRow> {
    const target = await this.repo.findById(targetId);
    if (!target) throw new NotFoundException('Usuario no encontrado');

    this.assertCanManageGym(requestingUser, target.gym_id ?? undefined);

    const updated = await this.repo.update(targetId, dto);
    if (!updated) throw new InternalServerErrorException('No se pudo actualizar el usuario');

    return updated;
  }

  async listGymUsers(gymId: string, filter: UserFilterDto, requestingUser: ProfileRow): Promise<PaginatedUsers> {
    this.assertCanManageGym(requestingUser, gymId);
    return this.repo.findByGymId(gymId, filter);
  }

  // ── Guards internos ──────────────────────────────────────────────────────

  private assertCanManageGym(user: ProfileRow, gymId?: string | null): void {
    if (user.role === 'super_admin') return;

    if (user.role !== 'gym_admin') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción');
    }

    if (gymId && user.gym_id !== gymId) {
      throw new ForbiddenException('No tienes permisos sobre este gimnasio');
    }
  }
}