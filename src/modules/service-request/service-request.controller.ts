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

import { ActionResponseDto } from '@/common/dto/action-response.dto';

import { type AuthenticatedUser } from '../auth/auth.interface';
import { CurrentUser } from '../auth/decorators/currentUser.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppRole } from '../auth/role.enum';
import { AssignServiceRequestDto } from './dto/assign.dto';
import { CancelServiceRequestDto } from './dto/cancel-service-request.dto';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { FindServiceRequestDto } from './dto/find-service-request.dto';
import {
  CreateServiceRequestsResponseDto,
  PaginatedServiceRequestsDto,
  ServiceRequestDetailDto,
} from './dto/service-request-response.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';
import { ServiceRequestService } from './service-request.service';

@ApiTags('service-requests')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'No autenticado' })
@UseGuards(JwtAuthGuard)
@Controller('service-requests')
export class ServiceRequestController {
  constructor(private readonly serviceRequestService: ServiceRequestService) {}

  @Get(':id')
  @Roles(AppRole.MEMBER, AppRole.OPERATOR, AppRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Detalle de una solicitud con las acciones permitidas al usuario',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiForbiddenResponse({
    description: 'El socio no es el dueño o el operario no la tiene asignada',
  })
  @ApiNotFoundResponse({ description: 'Solicitud no encontrada' })
  @ApiOkResponse({ type: ServiceRequestDetailDto })
  getOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.serviceRequestService.findOne(id, user);
  }

  @Get()
  @Roles(AppRole.OPERATOR, AppRole.ADMIN, AppRole.MEMBER)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary:
      'Lista paginada; socio: propias, operario: asignadas, admin: todas. Con date=today filtra scheduledDate de hoy (Argentina)',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    example: 'today',
    description:
      'Si vale "today", devuelve solo solicitudes con scheduledDate de hoy (00:00–23:59:59, America/Argentina/Buenos_Aires)',
  })
  @ApiOkResponse({ type: PaginatedServiceRequestsDto })
  async getRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query() dto: FindServiceRequestDto,
    @Query('date') date?: string,
  ) {
    if (user.role === AppRole.OPERATOR) {
      return this.serviceRequestService.getAllPaginated(
        dto,
        user.internalId,
        undefined,
        date,
      );
    }
    if (user.role === AppRole.MEMBER) {
      return this.serviceRequestService.getAllPaginated(
        dto,
        undefined,
        user.internalId,
        date,
      );
    }
    return this.serviceRequestService.getAllPaginated(
      dto,
      undefined,
      undefined,
      date,
    );
  }

  @Post()
  @Roles(AppRole.MEMBER)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary:
      'Crea una solicitud por cada servicio elegido para una embarcación propia',
  })
  @ApiForbiddenResponse({ description: 'La embarcación no pertenece al socio' })
  @ApiBadRequestResponse({
    description: 'Algún servicio no existe o está inactivo',
  })
  @ApiCreatedResponse({ type: CreateServiceRequestsResponseDto })
  create(
    @Body() dto: CreateServiceRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.serviceRequestService.create(dto, user.internalId);
  }

  @Patch(':id')
  @Roles(AppRole.OPERATOR, AppRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary:
      'Actualiza el estado (solo operario asignado) y/o el comentario interno',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBadRequestResponse({
    description: 'Sin cambios o transición de estado no permitida',
  })
  @ApiForbiddenResponse({
    description:
      'Solicitud no asignada al operario, o el admin intentó cambiar el estado',
  })
  @ApiNotFoundResponse({ description: 'Solicitud no encontrada' })
  @ApiOkResponse({ type: ActionResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.serviceRequestService.updateManagement(id, dto, user);
  }

  @Patch(':id/assign')
  @Roles(AppRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Asigna operario y fecha/hora; pasa la solicitud a SCHEDULED',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBadRequestResponse({
    description: 'Estado no asignable o el empleado no es operario',
  })
  @ApiNotFoundResponse({ description: 'Solicitud u operario no encontrado' })
  @ApiOkResponse({ type: ActionResponseDto })
  assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignServiceRequestDto,
  ) {
    return this.serviceRequestService.assign(id, dto);
  }

  @Patch(':id/cancel')
  @Roles(AppRole.MEMBER, AppRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Cancela (socio: propia y PENDING; admin: PENDING o SCHEDULED)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBadRequestResponse({
    description: 'La solicitud no está en un estado cancelable',
  })
  @ApiForbiddenResponse({ description: 'La solicitud no pertenece al socio' })
  @ApiNotFoundResponse({ description: 'Solicitud no encontrada' })
  @ApiOkResponse({ type: ActionResponseDto })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelServiceRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.serviceRequestService.cancel(id, user, dto.reason);
  }
}
