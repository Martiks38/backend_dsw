import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { MessageResponseDto } from '@/common/dto/message-response.dto';

import { UpdateMemberResponseDto } from '../members/dto';
import { EmployeeResponseDto } from './dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

@ApiTags('employees')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @ApiOperation({ summary: 'Crea un nuevo empleado (User + Employee)' })
  @ApiCreatedResponse({ type: CreateEmployeeDto })
  @ApiConflictResponse({
    description: 'Email, documento o matrícula ya registrada para otro usuario',
  })
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Busca un empleado por su publiId' })
  @ApiParam({
    name: 'publicId',
    type: 'string',
    description: 'Identificador público',
  })
  @ApiOkResponse({
    description: 'Se encontró un empleado con el ID proporcionado',
    type: EmployeeResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Empleado no encontrado' })
  findOne(@Param('publicId') publicId: string) {
    return this.employeesService.findOne(publicId);
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
  @ApiOkResponse({
    description: 'Los datos del empleado se actualizaron exitosamente',
    type: UpdateMemberResponseDto,
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

  @Delete(':publicId')
  @ApiOperation({ summary: 'Deshabilitar un empleado' })
  @ApiParam({
    name: 'publicId',
    type: 'string',
    description: 'Identificador público',
  })
  @ApiOkResponse({
    description: 'El empleado fue deshabilidado existosamente',
    type: MessageResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No se encontró un socio activo con el ID proporcionado',
  })
  remove(@Param('publicId') publicId: string) {
    return this.employeesService.remove(publicId);
  }
}
