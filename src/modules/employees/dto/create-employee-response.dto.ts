import { ApiPropertyOptional } from '@nestjs/swagger';

import { EmployeeType } from '@/generated/prisma/enums';

export class CreateEmployeeResponseDto {
  publicId!: string;

  email!: string;

  @ApiPropertyOptional({ nullable: true })
  phoneNumber!: string;

  @ApiPropertyOptional({ nullable: true })
  documentType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  documentNumber!: string | null;

  @ApiPropertyOptional({ nullable: true })
  employeeType!: EmployeeType;

  @ApiPropertyOptional({ nullable: true })
  employeeNumber!: string | null;
}
