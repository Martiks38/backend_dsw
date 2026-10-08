import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CreatedResourceResponseDto } from '@/common/dto/action-response.dto';

import { type AuthenticatedUser } from '../auth/auth.interface';
import { CurrentUser } from '../auth/decorators/currentUser.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppRole } from '../auth/role.enum';
import { BoatsService } from './boats.service';
import {
  BoatsAdminOverviewDto,
  GuardiaOverviewDto,
  MyBoatDto,
} from './dto/boat-response.dto';
import { CreateBoatDto } from './dto/create-boat.dto';

@ApiTags('boats')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'No autenticado' })
@UseGuards(JwtAuthGuard)
@Controller('boats')
export class BoatsController {
  constructor(private readonly boatsService: BoatsService) {}

  @Get('me')
  @Roles(AppRole.MEMBER)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Embarcaciones del socio autenticado, con su estado de guarda',
  })
  @ApiForbiddenResponse({ description: 'Rol insuficiente (solo MEMBER)' })
  @ApiOkResponse({ type: MyBoatDto, isArray: true })
  getMyBoats(@CurrentUser() user: AuthenticatedUser) {
    return this.boatsService.findByMember(user.internalId);
  }

  @Get('marina')
  @Roles(AppRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary:
      'Ocupación de la guardería: cunas, próximas salidas, estadía promedio',
  })
  @ApiForbiddenResponse({ description: 'Rol insuficiente (solo ADMIN)' })
  @ApiOkResponse({ type: GuardiaOverviewDto })
  getMarina() {
    return this.boatsService.getGuardiaOverview();
  }

  @Get()
  @Roles(AppRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Embarcaciones con contrato activo y su estado calculado',
  })
  @ApiForbiddenResponse({ description: 'Rol insuficiente (solo ADMIN)' })
  @ApiOkResponse({ type: BoatsAdminOverviewDto })
  findAllWithStatus() {
    return this.boatsService.getAdminOverview();
  }

  @Post()
  @Roles(AppRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary:
      'Da de alta una embarcación junto con su contrato de guarda inicial',
  })
  @ApiForbiddenResponse({ description: 'Rol insuficiente (solo ADMIN)' })
  @ApiNotFoundResponse({
    description: 'Cliente o tipo de embarcación no encontrado',
  })
  @ApiConflictResponse({
    description: 'Matrícula ya registrada o cuna no disponible',
  })
  @ApiCreatedResponse({ type: CreatedResourceResponseDto })
  create(@Body() dto: CreateBoatDto) {
    return this.boatsService.create(dto);
  }
}
