import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';

import { UsersController } from './controllers/users.controller';
import { UsersAdminController } from './controllers/users-admin.controller';
import { UsersService } from './services/users.service';
import { UsersRepository } from './repositories/users.repository';
import { EncryptionModule } from '@modules/encryption/encryption.module';

@Module({
  imports: [SupabaseModule, EncryptionModule],
  controllers: [UsersController, UsersAdminController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}