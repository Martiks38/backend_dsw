import { ApiProperty } from '@nestjs/swagger';

import { EmployeeType } from '@/generated/prisma/client';

export class EmployeeProfileDto {
  @ApiProperty({ enum: ['employee'] }) type!: 'employee';
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty() email!: string;
  @ApiProperty() phoneNumber!: string;
  @ApiProperty({ enum: EmployeeType }) role!: EmployeeType;
  @ApiProperty({ example: '12/3/2025' }) joinedAtLabel!: string;
}

export class BusinessProfileDto {
  @ApiProperty({ enum: ['business'] }) type!: 'business';
  @ApiProperty() businessName!: string;
  @ApiProperty() email!: string;
  @ApiProperty() phoneNumber!: string;
  @ApiProperty() documentNumber!: string;
}

export class IndividualProfileDto {
  @ApiProperty({ enum: ['individual'] }) type!: 'individual';
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty() email!: string;
  @ApiProperty() phoneNumber!: string;
  @ApiProperty() documentNumber!: string;
}
