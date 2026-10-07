import { ApiProperty } from '@nestjs/swagger';

import { EmployeeType } from '@/generated/prisma/client';

export class EmployeeResponseDto {
  @ApiProperty()
  publicId!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  phoneNumber!: string;

  @ApiProperty()
  employeeNumber!: string;

  @ApiProperty({ enum: EmployeeType })
  employeeType!: EmployeeType;

  @ApiProperty()
  isActive!: boolean;
}

export class EmployeeListItemDto extends EmployeeResponseDto {
  @ApiProperty({ description: 'Cantidad de solicitudes asignadas al empleado' })
  assignedServices!: number;
}

export class CreateEmployeeResponseDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty()
  publicId!: string;
}

export class SetEmployeeStatusResponseDto {
  @ApiProperty()
  success!: boolean;
}
