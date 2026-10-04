import { Controller, Get, UseGuards } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppRole } from '../auth/role.enum';

@UseGuards(JwtAuthGuard)
@Controller('boat-types')
export class BoatTypesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(AppRole.ADMIN)
  @UseGuards(RolesGuard)
  findAll() {
    return this.prisma.boatType.findMany({ orderBy: { name: 'asc' } });
  }
}
