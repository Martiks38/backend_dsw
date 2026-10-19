import { ApiProperty, PickType } from '@nestjs/swagger';

import { EmployeeType } from '@/generated/prisma/client';

export class EmployeeBaseDto {
  @ApiProperty() publicId!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty() phoneNumber!: string;
  @ApiProperty() documentType!: string;
  @ApiProperty() documentNumber!: string;
  @ApiProperty() email!: string;
}

export class EmployeeResponseDto extends EmployeeBaseDto {
  @ApiProperty() employeeNumber!: string;

  @ApiProperty({ enum: EmployeeType })
  employeeType!: EmployeeType;

  @ApiProperty() isEmployee!: boolean;
  @ApiProperty() isActive!: boolean;
}

export class OperatorResponseDto extends EmployeeBaseDto {
  @ApiProperty() employeeNumber!: string;
}

export class UpdateEmployeeResponseDto extends PickType(EmployeeBaseDto, [
  'publicId',
  'firstName',
  'lastName',
  'email',
  'phoneNumber',
] as const) {}

export class EmployeeListItemDto {
  @ApiProperty() publicId!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: ['Admin', 'Operador'] })
  role!: 'Admin' | 'Operador';
  @ApiProperty() phoneNumber!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty({ description: 'Solicitudes asignadas al empleado' })
  assignedServices!: number;
}
