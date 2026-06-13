import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';

import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { SupabaseJwtGuard } from './guards/supabase-jwt.guard';
import { EncryptionModule } from '@modules/encryption/encryption.module';

@Module({
  imports: [SupabaseModule, EncryptionModule],
  controllers: [AuthController],
  providers: [AuthService, SupabaseJwtGuard],
  exports: [AuthService],
})
export class AuthModule {}