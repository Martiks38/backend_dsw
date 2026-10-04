import { Controller, Get, UseGuards } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppRole } from '../auth/role.enum';

@UseGuards(JwtAuthGuard)
@Controller('cradles')
export class CradlesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('available')
  @Roles(AppRole.ADMIN)
  @UseGuards(RolesGuard)
  async findAvailable() {
    return this.prisma.cradle.findMany({
      where: { boatHasBoatSlips: { none: { endDatetime: null } } },
      orderBy: { cradleCode: 'asc' },
    });
  }
}
