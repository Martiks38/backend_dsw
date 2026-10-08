import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { type AuthenticatedUser } from '../auth/auth.interface';
import { CurrentUser } from '../auth/decorators/currentUser.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppRole } from '../auth/role.enum';
import { DashboardService } from './dashboard.service';
import {
  AdminDashboardDto,
  MemberDashboardDto,
  OperatorDashboardDto,
} from './dto/dashboard-response.dto';

@ApiTags('dashboard')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'No autenticado' })
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('operador')
  @Roles(AppRole.OPERATOR)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary:
      'Panel del operario: estadísticas, tareas de hoy y ranking del mes',
  })
  @ApiForbiddenResponse({ description: 'Rol insuficiente (solo OPERATOR)' })
  @ApiOkResponse({ type: OperatorDashboardDto })
  getOperatorDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getOperatorDashboard(user.internalId);
  }

  @Get('admin')
  @Roles(AppRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Panel del administrador: estadísticas y solicitudes pendientes',
  })
  @ApiForbiddenResponse({ description: 'Rol insuficiente (solo ADMIN)' })
  @ApiOkResponse({ type: AdminDashboardDto })
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('socio')
  @Roles(AppRole.MEMBER)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Panel del socio: embarcaciones, solicitudes y próximo servicio',
  })
  @ApiForbiddenResponse({ description: 'Rol insuficiente (solo MEMBER)' })
  @ApiOkResponse({ type: MemberDashboardDto })
  getMemberDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getMemberDashboard(user.internalId);
  }
}
