import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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

import { type AuthenticatedUser } from '../auth/auth.interface';
import { CurrentUser } from '../auth/decorators/currentUser.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppRole } from '../auth/role.enum';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import {
  EmployeeListItemDto,
  EmployeeResponseDto,
  OperatorResponseDto,
  UpdateEmployeeResponseDto,
} from './dto/employee-response.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

@ApiTags('employees')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'No autenticado' })
@ApiForbiddenResponse({ description: 'Rol insuficiente (solo ADMIN)' })
@Roles(AppRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @ApiOperation({
    summary: 'Da de alta un empleado y le envía sus credenciales por email',
  })
  @ApiConflictResponse({
    description: 'Email o documento ya registrados; incluye fieldErrors',
  })
  @ApiCreatedResponse({ type: CreatedResourceResponseDto })
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Busca un empleado por su publicId' })
  @ApiParam({ name: 'publicId', type: String })
  @ApiNotFoundResponse({ description: 'Empleado no encontrado' })
  @ApiOkResponse({ type: EmployeeResponseDto })
  findOne(@Param('publicId') publicId: string) {
    return this.employeesService.findOne(publicId);
  }

  @Get('operators')
  @ApiOperation({ summary: 'Obtiene todos los operadores' })
  @ApiOkResponse({ type: OperatorResponseDto, isArray: true })
  getOperators() {
    return this.employeesService.getAllOperators();
  }

  @Get()
  @ApiOperation({
    summary: 'Lista los empleados con rol, estado y servicios asignados',
  })
  @ApiOkResponse({ type: EmployeeListItemDto, isArray: true })
  getAll() {
    return this.employeesService.getAllPaginated();
  }

  @Patch(':publicId')
  @ApiOperation({ summary: 'Actualiza los datos de un empleado' })
  @ApiParam({ name: 'publicId', type: String })
  @ApiNotFoundResponse({
    description: 'Empleado no encontrado o deshabilitado',
  })
  @ApiConflictResponse({
    description: 'El email ya está registrado por otro usuario',
  })
  @ApiOkResponse({ type: UpdateEmployeeResponseDto })
  update(@Param('publicId') publicId: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(publicId, dto);
  }

  @Patch(':publicId/status')
  @ApiOperation({
    summary: 'Activa o desactiva la cuenta de un empleado (no la propia)',
  })
  @ApiParam({ name: 'publicId', type: String })
  @ApiNotFoundResponse({ description: 'Empleado no encontrado' })
  @ApiOkResponse({ type: ActionResponseDto })
  setStatus(
    @Param('publicId') publicId: string,
    @Body() dto: SetActiveStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.employeesService.setStatus(
      publicId,
      dto.isActive,
      user.internalId,
    );
  }
}
