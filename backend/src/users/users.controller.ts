import {
  Controller, Get, Post, Body, Put, Param, Patch, Delete,
  UseGuards, Query, ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/roles.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * Controlador de usuarios.
 * Gestiona el ciclo de vida de las cuentas de usuario: creacion, consulta,
 * actualizacion de perfil, desactivacion y gestion de avatares.
 *
 * Control de acceso:
 *   ADMIN    -> Acceso total: listar todos, crear, editar cualquier perfil, desactivar.
 *   ANALISTA -> Solo puede consultar y actualizar su propio perfil.
 *   VIEWER   -> Solo puede consultar su propio perfil.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Retorna la lista paginada de todos los usuarios del sistema.
   * Requiere rol ADMIN.
   */
  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.usersService.findAll(pagination);
  }

  /**
   * Crea un nuevo usuario en el sistema.
   * Requiere rol ADMIN.
   */
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * Retorna los datos de un usuario especifico por su ID.
   * Un usuario no administrador solo puede consultar su propio perfil.
   */
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user) {
    if (user.role !== Role.ADMIN && user.id !== id) {
      throw new ForbiddenException('No tiene permiso para consultar este perfil');
    }
    return this.usersService.findOne(id);
  }

  /**
   * Actualiza los datos de un usuario por su ID.
   * Requiere rol ADMIN para modificar cualquier cuenta.
   */
  @Roles(Role.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Permite a un usuario actualizar su propio perfil (nombre, cargo, etc.).
   * Solo el propio usuario puede modificar su perfil; el rol ADMIN puede usar PUT.
   */
  @Patch(':id/profile')
  updateProfile(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto, @CurrentUser() user) {
    if (user.id !== id) {
      throw new ForbiddenException('Solo puede actualizar su propio perfil');
    }
    return this.usersService.updateProfile(id, updateProfileDto);
  }

  /**
   * Desactiva la cuenta de un usuario (baja logica, no eliminacion fisica).
   * Requiere rol ADMIN.
   */
  @Roles(Role.ADMIN)
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  /**
   * Actualiza la imagen de avatar del usuario.
   * Un usuario no administrador solo puede actualizar su propio avatar.
   */
  @Post(':id/avatar')
  updateAvatar(@Param('id') id: string, @Body('filename') filename: string, @CurrentUser() user) {
    if (user.role !== Role.ADMIN && user.id !== id) {
      throw new ForbiddenException('No tiene permiso para modificar este avatar');
    }
    return this.usersService.updateAvatar(id, filename);
  }
}
