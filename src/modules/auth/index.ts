export { AuthModule } from './auth.module';
export { AuthService } from './services/auth.service';
export type { AuthResponse, SafeProfile } from './services/auth.service';
export { RegisterDto, LoginDto, OAuthCallbackDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto, CrmRegisterDto } from './dtos/auth.dto';
export { SyncProfileDto } from './dtos/sync-profile.dto';
export { UpdateProfileDto, ChangePasswordDto, ChangeEmailDto } from './dtos/update-profile.dto';