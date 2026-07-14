import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get(':publicId')
  findOne(@Param('publicId') publicId: string) {
    return this.employeesService.findOne(publicId);
  }

  @Patch(':publicId')
  update(
    @Param('publicId') publicId: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(publicId, updateEmployeeDto);
  }

  @Delete(':publicId')
  remove(@Param('publicId') publicId: string) {
    return this.employeesService.remove(publicId);
  }
}
