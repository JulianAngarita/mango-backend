import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../services/auth.service';
import {
  RegisterDto,
  LoginDto,
  OAuthCallbackDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  CrmRegisterDto,
} from '../dtos/auth.dto';
import { SyncProfileDto } from '../dtos/sync-profile.dto';
import { ChangePasswordDto, ChangeEmailDto } from '../dtos/update-profile.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { SupabaseJwtGuard } from '../guards/supabase-jwt.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ProfileRow } from '../../../supabase/supabase.types';

/**
 * AuthController — endpoints de autenticación para APP y CRM.
 *
 * Públicos:  register, crm/register, login, oauth/callback, refresh, forgot-password
 * Protegidos: logout, reset-password, change-password, change-email, me, sync-profile
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Registro ─────────────────────────────────────────────────────────────

  @Public()
  @Post('register')
  @Throttle({ auth: { ttl: 60_000, limit: 5 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.registerUser(dto);
  }

  @Public()
  @Post('crm/register')
  @Throttle({ auth: { ttl: 60_000, limit: 5 } })
  registerCrm(@Body() dto: CrmRegisterDto) {
    return this.authService.registerCrmUser(dto);
  }

  // ── Login ────────────────────────────────────────────────────────────────

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { ttl: 60_000, limit: 10 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('oauth/callback')
  @HttpCode(HttpStatus.OK)
  oauthCallback(@Body() dto: OAuthCallbackDto) {
    return this.authService.handleOAuthCallback(dto);
  }

  // ── Tokens ───────────────────────────────────────────────────────────────

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SupabaseJwtGuard)
  logout(@Request() req: { accessToken: string }) {
    return this.authService.logout(req.accessToken);
  }

  // ── Recuperación de contraseña ───────────────────────────────────────────

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ auth: { ttl: 60_000, limit: 3 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SupabaseJwtGuard)
  resetPassword(
    @Body() dto: ResetPasswordDto,
    @Request() req: { accessToken: string },
  ) {
    return this.authService.resetPassword(dto.new_password, req.accessToken);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SupabaseJwtGuard)
  changePassword(
    @Body() dto: ChangePasswordDto,
    @Request() req: { accessToken: string },
  ) {
    return this.authService.changePassword(dto, req.accessToken);
  }

  @Post('change-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SupabaseJwtGuard)
  changeEmail(
    @Body() dto: ChangeEmailDto,
    @Request() req: { accessToken: string },
  ) {
    return this.authService.changeEmail(dto.new_email, req.accessToken);
  }

  // ── Perfil ───────────────────────────────────────────────────────────────

  @Get('me')
  @UseGuards(SupabaseJwtGuard)
  me(@CurrentUser() user: ProfileRow) {
    return { user };
  }

  @Post('sync-profile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SupabaseJwtGuard)
  syncProfile(
    @Body() dto: SyncProfileDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.authService.syncProfile(userId, dto);
  }
}