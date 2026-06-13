import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dtos/update-users.dto';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

/**
 * UsersController — endpoints B2C para gestión del perfil propio.
 *
 * GET    /users/me             — perfil propio descifrado
 * PATCH  /users/me             — actualizar perfil propio
 * DELETE /users/me             — eliminar cuenta (GDPR)
 * GET    /users/:id/public     — perfil público de otro usuario
 */
@Controller('users')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getMyProfile(userId);
  }

  @Patch('me')
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateMyProfile(userId, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyAccount(@CurrentUser('id') userId: string) {
    await this.usersService.deleteMyAccount(userId);
  }

  @Get(':id/public')
  async getPublicProfile(@Param('id') userId: string) {
    return this.usersService.getPublicProfile(userId);
  }
}