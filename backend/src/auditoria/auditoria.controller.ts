import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/roles.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() filters: any) {
    return this.auditoriaService.findAll(filters);
  }

  @Get('recent')
  getRecentActivity() {
    return this.auditoriaService.getRecentActivity(20);
  }

  @Roles(Role.ADMIN)
  @Get('user/:id')
  getUserActivity(@Param('id') id: string, @Query() pagination: any) {
    return this.auditoriaService.getUserActivity(id, pagination);
  }
}
