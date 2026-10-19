import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { PrismaService } from '@/prisma/prisma.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ServiceTypeOptionDto } from './dto/service-type-response.dto';

@ApiTags('service-types')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller('service-types')
export class ServiceTypesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Lista los tipos de servicio activos' })
  @ApiOkResponse({ type: ServiceTypeOptionDto, isArray: true })
  findAll() {
    return this.prisma.serviceType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { serviceTypeId: true, name: true },
    });
  }
}
