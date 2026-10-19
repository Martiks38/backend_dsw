import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { type AuthenticatedUser } from '../auth/auth.interface';
import { CurrentUser } from '../auth/decorators/currentUser.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppRole } from '../auth/role.enum';
import { BoatDepartureService } from './boat-departure.service';
import {
  ActiveBoatDepartureDto,
  BoatDepartureResponseDto,
} from './dto/boat-departure-response.dto';
import { CreateBoatDepartureDto } from './dto/create-boat-departure.dto';
import { FindActiveBoatDeparturesDto } from './dto/find-active-boat-departures.dto';

@ApiTags('boat-departures')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'No autenticado' })
@ApiForbiddenResponse({ description: 'Rol insuficiente (solo OPERATOR)' })
@Roles(AppRole.OPERATOR)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('boat-departures')
export class BoatDeparturesController {
  constructor(private readonly boatDepartureService: BoatDepartureService) {}

  @Post()
  @ApiOperation({
    summary: 'Registra la salida de una embarcación a partir de su publicId',
  })
  @ApiNotFoundResponse({
    description: 'Embarcación o tipo de servicio de botadura no encontrado',
  })
  @ApiConflictResponse({
    description: 'La embarcación ya tiene una salida activa',
  })
  @ApiBadRequestResponse({
    description: 'El retorno estimado no es posterior a la salida',
  })
  @ApiCreatedResponse({ type: BoatDepartureResponseDto })
  create(
    @Body() dto: CreateBoatDepartureDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.boatDepartureService.create(dto, user.internalId);
  }

  @Get('active')
  @ApiOperation({
    summary:
      'Lista las salidas sin retorno (barcos navegando), con filtro opcional por publicId, nombre, matrícula o dueño',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Filtra por publicId, nombre del bote, matrícula o dueño',
  })
  @ApiQuery({
    name: 'publicId',
    required: false,
    description: 'Filtra por el identificador público exacto de la embarcación',
  })
  @ApiOkResponse({ type: ActiveBoatDepartureDto, isArray: true })
  findActive(@Query() dto: FindActiveBoatDeparturesDto) {
    return this.boatDepartureService.findActive(dto);
  }

  @Patch(':id/return')
  @ApiOperation({
    summary:
      'Registra el retorno de una salida con la fecha y hora actuales (UTC)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID numérico de boat_departure',
  })
  @ApiNotFoundResponse({ description: 'Salida no encontrada' })
  @ApiBadRequestResponse({
    description: 'La salida ya tiene un retorno registrado',
  })
  @ApiOkResponse({ type: BoatDepartureResponseDto })
  registerReturn(@Param('id', ParseIntPipe) id: number) {
    return this.boatDepartureService.registerReturn(id);
  }
}
