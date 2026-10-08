import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  ActionResponseDto,
  CreatedResourceResponseDto,
} from '@/common/dto/action-response.dto';
import { SetActiveStatusDto } from '@/common/dto/set-active-status.dto';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppRole } from '../auth/role.enum';
import { ClientsService } from './clients.service';
import {
  ClientOptionDto,
  PaginatedClientsDto,
} from './dto/client-response.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { FindClientsDto } from './dto/find-clients.dto';

@ApiTags('clients')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'No autenticado' })
@ApiForbiddenResponse({ description: 'Rol insuficiente (solo ADMIN)' })
@Roles(AppRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('options')
  @ApiOperation({ summary: 'Socios activos en formato simple, para selects' })
  @ApiOkResponse({ type: ClientOptionDto, isArray: true })
  getOptions() {
    return this.clientsService.findAllOptions();
  }

  @Get()
  @ApiOperation({
    summary: 'Lista paginada de socios con filtros y estadísticas',
  })
  @ApiOkResponse({ type: PaginatedClientsDto })
  getAll(@Query() dto: FindClientsDto) {
    return this.clientsService.getAllPaginated(dto);
  }

  @Post()
  @ApiOperation({
    summary:
      'Da de alta un socio (persona física o empresa) y le envía sus credenciales',
  })
  @ApiConflictResponse({
    description: 'Email o documento ya registrados; incluye fieldErrors',
  })
  @ApiCreatedResponse({ type: CreatedResourceResponseDto })
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Patch(':publicId/status')
  @ApiOperation({ summary: 'Activa o desactiva la cuenta de un socio' })
  @ApiParam({ name: 'publicId', type: String })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado' })
  @ApiOkResponse({ type: ActionResponseDto })
  setStatus(
    @Param('publicId') publicId: string,
    @Body() dto: SetActiveStatusDto,
  ) {
    return this.clientsService.setStatus(publicId, dto.isActive);
  }
}
