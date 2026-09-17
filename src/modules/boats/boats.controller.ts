import { Controller, Get, UseGuards } from '@nestjs/common';

import { type AuthenticatedUser } from '../auth/auth.interface';
import { CurrentUser } from '../auth/decorators/currentUser.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppRole } from '../auth/role.enum';
import { BoatsService } from './boats.service';

@UseGuards(JwtAuthGuard)
@Controller('boats')
export class BoatsController {
  constructor(private readonly boatsService: BoatsService) {}

  @Get('me')
  @Roles(AppRole.MEMBER)
  @UseGuards(RolesGuard)
  getMyBoats(@CurrentUser() user: AuthenticatedUser) {
    return this.boatsService.findByMember(user.internalId);
  }
}
