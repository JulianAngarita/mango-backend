import {
  Injectable,
  Logger,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../../supabase/supabase.service';
import { SupabaseAnonService } from '../../../supabase/supabase-anon.service';
import {
  RegisterDto,
  LoginDto,
  OAuthCallbackDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  CrmRegisterDto,
} from '../dtos/auth.dto';
import { SyncProfileDto } from '../dtos/sync-profile.dto';
import { ChangePasswordDto } from '../dtos/update-profile.dto';
import { ProfileRow } from '../../../supabase/supabase.types';
import { EncryptionService } from '@modules/encryption/encryption.service';

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: SafeProfile;
}

export interface SafeProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: string;
  role: string;
  xp_total: number;
  level: number;
  current_streak: number;
  onboarding_completed: boolean;
  gym_id: string | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly supabaseAnon: SupabaseAnonService,
    private readonly encryption: EncryptionService,
    private readonly config: ConfigService,
  ) {}

  // ── Registro B2C ─────────────────────────────────────────────────────────

  async registerUser(dto: RegisterDto): Promise<AuthResponse> {
    await this.assertEmailNotTaken(dto.email);

    const { data: authData, error: authError } = await this.supabaseAnon
      .getBaseClient()
      .auth.signUp({
        email: dto.email,
        password: dto.password,
        options: { data: { full_name: dto.full_name } },
      });

    if (authError || !authData.user) {
      this.logger.error('Error en signUp de Supabase Auth', authError);
      if (authError?.message?.includes('already registered')) {
        throw new ConflictException('Este email ya está registrado');
      }
      throw new InternalServerErrorException('Error al crear la cuenta');
    }

    const profile = await this.createProfile(
      authData.user.id,
      dto.email,
      dto.full_name,
      dto.phone,
    );

    this.logger.log(`Usuario B2C registrado: ${authData.user.id}`);
    return this.buildAuthResponse(authData.session!, profile);
  }

  // ── Registro B2B (CRM) ───────────────────────────────────────────────────

  async registerCrmUser(dto: CrmRegisterDto): Promise<AuthResponse> {
    await this.assertEmailNotTaken(dto.email);

    const { data: authData, error: authError } = await this.supabaseAnon
      .getBaseClient()
      .auth.signUp({
        email: dto.email,
        password: dto.password,
        options: { data: { full_name: dto.full_name, role: dto.role } },
      });

    if (authError || !authData.user) {
      this.logger.error('Error en signUp CRM', authError);
      if (authError?.message?.includes('already registered')) {
        throw new ConflictException('Este email ya está registrado');
      }
      throw new InternalServerErrorException('Error al crear la cuenta');
    }

    const userId = authData.user.id;
    const encryptedName = this.encryption.encrypt(dto.full_name);
    const encryptedPhone = dto.phone ? this.encryption.encrypt(dto.phone) : null;
    const emailHash = this.encryption.hashForSearch(dto.email);

    const { data: profile, error: profileError } = await (this.supabase.getClient() as any)
      .from('profiles')
      .insert({
        id: userId,
        email: dto.email,
        email_hash: emailHash,
        full_name: encryptedName,
        phone: encryptedPhone,
        role: dto.role,
        gym_id: dto.gym_id ?? null,
      })
      .select('*')
      .single();

    if (profileError || !profile) {
      await this.supabase.getClient().auth.admin.deleteUser(userId);
      this.logger.error('Error al crear perfil CRM — usuario Auth eliminado', profileError);
      throw new InternalServerErrorException('Error al crear el perfil');
    }

    this.logger.log(`Usuario CRM registrado: ${userId} (${dto.role})`);
    return this.buildAuthResponse(authData.session!, profile as unknown as ProfileRow);
  }

  // ── Login ────────────────────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<AuthResponse> {
    const { data, error } = await this.supabaseAnon
      .getBaseClient()
      .auth.signInWithPassword({ email: dto.email, password: dto.password });

    if (error || !data.user || !data.session) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const profile = await this.getProfileById(data.user.id);
    this.logger.log(`Login exitoso: ${data.user.id}`);
    return this.buildAuthResponse(data.session, profile);
  }

  // ── OAuth ────────────────────────────────────────────────────────────────

  async handleOAuthCallback(dto: OAuthCallbackDto): Promise<AuthResponse> {
    const { data, error } = await this.supabase
      .getClient()
      .auth.getUser(dto.access_token);

    if (error || !data.user) {
      throw new UnauthorizedException('Token OAuth inválido');
    }

    const user = data.user;

    const { data: existingProfile, error: existingError } = await (this.supabase.getClient() as any)
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (existingError) {
      this.logger.error('Error buscando perfil OAuth', existingError);
    }

    let profile: ProfileRow;
    if (!existingProfile) {
      const email = user.email ?? '';
      const fullName = (user.user_metadata?.full_name as string) ?? '';
      profile = await this.createProfile(user.id, email, fullName);
      this.logger.log(`Perfil OAuth creado para: ${user.id}`);
    } else {
      profile = existingProfile as unknown as ProfileRow;
    }

    const session = {
      access_token: dto.access_token,
      refresh_token: dto.refresh_token,
      expires_in: 3600,
    };

    return this.buildAuthResponse(session, profile);
  }

  // ── Refresh Token ────────────────────────────────────────────────────────

  async refreshToken(dto: RefreshTokenDto): Promise<AuthResponse> {
    const { data, error } = await this.supabaseAnon
      .getBaseClient()
      .auth.refreshSession({ refresh_token: dto.refresh_token });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const profile = await this.getProfileById(data.user.id);
    return this.buildAuthResponse(data.session, profile);
  }

  // ── Logout ───────────────────────────────────────────────────────────────

  async logout(accessToken: string): Promise<void> {
    const { error } = await this.supabaseAnon.forUser(accessToken).auth.signOut();
    if (error) {
      this.logger.warn(`Error al hacer logout: ${error.message}`);
    }
  }

  // ── Recuperación de contraseña ───────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const redirectUrl =
      this.config.get<string>('APP_RESET_PASSWORD_URL') ??
      'https://app.mango.fit/reset-password';

    await this.supabaseAnon
      .getBaseClient()
      .auth.resetPasswordForEmail(dto.email, { redirectTo: redirectUrl });

    this.logger.log(`Password reset solicitado para: ${dto.email}`);
  }

  async resetPassword(newPassword: string, accessToken: string): Promise<void> {
    const { error } = await this.supabaseAnon
      .forUser(accessToken)
      .auth.updateUser({ password: newPassword });

    if (error) {
      if (error.message?.includes('same password')) {
        throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
      }
      throw new BadRequestException('No se pudo cambiar la contraseña');
    }
  }

  // ── Cambio de contraseña autenticado ─────────────────────────────────────

  async changePassword(dto: ChangePasswordDto, accessToken: string): Promise<void> {
    const { data: userData } = await this.supabase.getClient().auth.getUser(accessToken);

    if (!userData.user?.email) {
      throw new UnauthorizedException('No autenticado');
    }

    const { error: loginError } = await this.supabaseAnon
      .getBaseClient()
      .auth.signInWithPassword({
        email: userData.user.email,
        password: dto.current_password,
      });

    if (loginError) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    await this.resetPassword(dto.new_password, accessToken);
  }

  // ── Cambio de email autenticado ──────────────────────────────────────────

  async changeEmail(newEmail: string, accessToken: string): Promise<void> {
    const { error } = await this.supabaseAnon
      .forUser(accessToken)
      .auth.updateUser({ email: newEmail });

    if (error) {
      throw new BadRequestException('No se pudo cambiar el email');
    }

    const emailHash = this.encryption.hashForSearch(newEmail);
    const { data: userData } = await this.supabase.getClient().auth.getUser(accessToken);

    if (userData.user?.id) {
      await (this.supabase.getClient() as any)
        .from('profiles')
        .update({ email: newEmail, email_hash: emailHash })
        .eq('id', userData.user.id);
    }
  }

  // ── Sincronización de perfil OAuth ───────────────────────────────────────

  async syncProfile(userId: string, dto: SyncProfileDto): Promise<SafeProfile> {
    const updatePayload: Record<string, unknown> = {};

    if (dto.full_name) updatePayload['full_name'] = this.encryption.encrypt(dto.full_name);
    if (dto.avatar_url) updatePayload['avatar_url'] = dto.avatar_url;
    if (dto.fcm_token) updatePayload['fcm_token'] = dto.fcm_token;

    if (Object.keys(updatePayload).length > 0) {
      await (this.supabase.getClient() as any)
        .from('profiles')
        .update({ ...updatePayload, updated_at: new Date().toISOString() })
        .eq('id', userId);
    }

    const profile = await this.getProfileById(userId);
    return this.decryptProfile(profile);
  }

  // ── Helpers privados ─────────────────────────────────────────────────────

  private async assertEmailNotTaken(email: string): Promise<void> {
    const emailHash = this.encryption.hashForSearch(email);
    const { data } = await (this.supabase.getClient() as any)
      .from('profiles')
      .select('id')
      .eq('email_hash', emailHash)
      .maybeSingle();

    if (data) {
      throw new ConflictException('Este email ya está registrado');
    }
  }

  private async createProfile(
    userId: string,
    email: string,
    fullName: string,
    phone?: string,
  ): Promise<ProfileRow> {
    const encryptedName = this.encryption.encrypt(fullName);
    const encryptedPhone = phone ? this.encryption.encrypt(phone) : null;
    const emailHash = this.encryption.hashForSearch(email);

    const { data: profile, error } = await (this.supabase.getClient() as any)
      .from('profiles')
      .insert({
        id: userId,
        email,
        email_hash: emailHash,
        full_name: encryptedName,
        phone: encryptedPhone,
        role: 'user',
      })
      .select('*')
      .single();

    if (error || !profile) {
      await this.supabase.getClient().auth.admin.deleteUser(userId);
      this.logger.error('Error al crear profile — usuario Auth eliminado', error);
      throw new InternalServerErrorException('Error al crear el perfil del usuario');
    }

    return profile as unknown as ProfileRow;
  }

  private async getProfileById(userId: string): Promise<ProfileRow> {
    const { data, error } = await (this.supabase.getClient() as any)
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new UnauthorizedException('Perfil no encontrado');
    }

    return data as unknown as ProfileRow;
  }

  private decryptProfile(profile: ProfileRow): SafeProfile {
    return {
      id: profile.id,
      email: profile.email,
      full_name: this.encryption.decrypt(profile.full_name),
      avatar_url: profile.avatar_url,
      plan: profile.plan,
      role: profile.role,
      xp_total: profile.xp_total,
      level: profile.level,
      current_streak: profile.current_streak,
      onboarding_completed: profile.onboarding_completed,
      gym_id: profile.gym_id,
    };
  }

  private buildAuthResponse(
    session: { access_token: string; refresh_token: string; expires_in: number },
    profile: ProfileRow,
  ): AuthResponse {
    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      user: this.decryptProfile(profile),
    };
  }
}