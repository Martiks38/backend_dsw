import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { SetActiveStatusDto } from '@/common/dto/set-active-status.dto';

import { type AuthenticatedUser } from '../auth/auth.interface';
import { CurrentUser } from '../auth/decorators/currentUser.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppRole } from '../auth/role.enum';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

@ApiTags('employees')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @Roles(AppRole.ADMIN)
  @UseGuards(RolesGuard)
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Busca un empleado por su publiId' })
  @ApiParam({
    name: 'publicId',
    type: 'string',
    description: 'Identificador público',
  })
  @ApiNotFoundResponse({ description: 'Empleado no encontrado' })
  findOne(@Param('publicId') publicId: string) {
    return this.employeesService.findOne(publicId);
  }

  @Get()
  @Roles(AppRole.ADMIN)
  @UseGuards(RolesGuard)
  getAll() {
    return this.employeesService.getAllPaginated();
  }

  @Patch(':publicId')
  @ApiOperation({ summary: 'Actualiza los datos de un empleado' })
  @ApiParam({
    name: 'publicId',
    type: 'string',
    description: 'Identificador público',
  })
  @ApiBody({
    type: UpdateEmployeeDto,
    description: 'Campos del empleado a modificar',
  })
  @ApiNotFoundResponse({
    description: 'Empleado no encontrado o deshabilitado',
  })
  @ApiConflictResponse({
    description:
      'El email, documento o matrícula ya está registrado por otro usuario',
  })
  update(
    @Param('publicId') publicId: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(publicId, updateEmployeeDto);
  }

  @Patch(':publicId/status')
  @Roles(AppRole.ADMIN)
  @UseGuards(RolesGuard)
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

  @Delete(':publicId')
  @ApiOperation({ summary: 'Deshabilitar un empleado' })
  @ApiParam({
    name: 'publicId',
    type: 'string',
    description: 'Identificador público',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró un socio activo con el ID proporcionado',
  })
  remove(@Param('publicId') publicId: string) {
    return this.employeesService.remove(publicId);
  }
}
