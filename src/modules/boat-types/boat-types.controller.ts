import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { PrismaService } from '@/prisma/prisma.service';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppRole } from '../auth/role.enum';
import { BoatTypeDto } from './boat-type-response.dto';

@ApiTags('boat-types')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'No autenticado' })
@ApiForbiddenResponse({ description: 'Rol insuficiente (solo ADMIN)' })
@Roles(AppRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('boat-types')
export class BoatTypesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Tipos de embarcación disponibles' })
  @ApiOkResponse({ type: BoatTypeDto, isArray: true })
  findAll() {
    return this.prisma.boatType.findMany({ orderBy: { name: 'asc' } });
  }
}
