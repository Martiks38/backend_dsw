import { Controller, Get, UseGuards } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('service-types')
export class ServiceTypesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.serviceType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { serviceTypeId: true, name: true },
    });
  }
}
