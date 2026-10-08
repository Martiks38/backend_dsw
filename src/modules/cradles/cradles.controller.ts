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
import { CradleDto } from './dto/cradle-response.dto';

@ApiTags('cradles')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'No autenticado' })
@ApiForbiddenResponse({ description: 'Rol insuficiente (solo ADMIN)' })
@Roles(AppRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cradles')
export class CradlesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('available')
  @ApiOperation({ summary: 'Cunas sin contrato activo' })
  @ApiOkResponse({ type: CradleDto, isArray: true })
  findAvailable() {
    return this.prisma.cradle.findMany({
      where: { boatHasBoatSlips: { none: { endDatetime: null } } },
      orderBy: { cradleCode: 'asc' },
    });
  }
}
