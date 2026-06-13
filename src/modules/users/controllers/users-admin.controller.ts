import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dtos/create-users.dto';
import { UpdateUserAdminDto } from '../dtos/update-users.dto';
import { UserFilterDto } from '../dtos/user-filter.dto';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ProfileRow } from '../../../supabase/supabase.types';

/**
 * UsersAdminController — endpoints B2B para gestión de usuarios del CRM.
 *
 * POST   /admin/users                    — crear usuario (registro exprés C04)
 * PATCH  /admin/users/:id                — editar usuario del staff (C02)
 * GET    /admin/users/gym/:gymId         — listar usuarios del gimnasio
 * GET    /admin/users/:id                — ver detalle de un usuario
 */
@Controller('admin/users')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('gym_admin', 'super_admin')
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser() requestingUser: ProfileRow,
  ) {
    return this.usersService.createUser(dto, requestingUser);
  }

  @Patch(':id')
  async updateUser(
    @Param('id') targetId: string,
    @Body() dto: UpdateUserAdminDto,
    @CurrentUser() requestingUser: ProfileRow,
  ) {
    return this.usersService.updateUser(targetId, dto, requestingUser);
  }

  @Get('gym/:gymId')
  async listGymUsers(
    @Param('gymId') gymId: string,
    @Query() filter: UserFilterDto,
    @CurrentUser() requestingUser: ProfileRow,
  ) {
    return this.usersService.listGymUsers(gymId, filter, requestingUser);
  }

  @Get(':id')
  async getUserDetail(
    @Param('id') userId: string,
    @CurrentUser() requestingUser: ProfileRow,
  ) {
    // gym_admin solo puede ver usuarios de su propio gym — lo valida el servicio
    return this.usersService.getMyProfile(userId);
  }
}