import { ApiProperty } from '@nestjs/swagger';

import { EmployeeType } from '@/generated/prisma/client';

export class EmployeeResponseDto {
  @ApiProperty() publicId!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty() phoneNumber!: string;
  @ApiProperty() documentType!: string;
  @ApiProperty() documentNumber!: string;
  @ApiProperty() email!: string;
  @ApiProperty() employeeNumber!: string;
  @ApiProperty({ enum: EmployeeType }) employeeType!: EmployeeType;
  @ApiProperty() isEmployee!: boolean;
  @ApiProperty() isActive!: boolean;
}

export class UpdateEmployeeResponseDto {
  @ApiProperty() publicId!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty() email!: string;
  @ApiProperty() phoneNumber!: string;
}

export class EmployeeListItemDto {
  @ApiProperty() publicId!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: ['Admin', 'Operador'] }) role!: 'Admin' | 'Operador';
  @ApiProperty() phoneNumber!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty({ description: 'Solicitudes asignadas al empleado' })
  assignedServices!: number;
}
