import { Controller, Get, UseGuards } from '@nestjs/common';

import { type AuthenticatedUser } from '../auth/auth.interface';
import { CurrentUser } from '../auth/decorators/currentUser.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppRole } from '../auth/role.enum';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('operador')
  @Roles(AppRole.OPERATOR)
  @UseGuards(RolesGuard)
  getOperatorDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getOperatorDashboard(user.internalId);
  }

  @Get('admin')
  @Roles(AppRole.ADMIN)
  @UseGuards(RolesGuard)
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('socio')
  @Roles(AppRole.MEMBER)
  @UseGuards(RolesGuard)
  getMemberDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getMemberDashboard(user.internalId);
  }
}
