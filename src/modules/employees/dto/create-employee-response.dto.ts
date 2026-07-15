import { ApiPropertyOptional } from '@nestjs/swagger';

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
  employeeType!: string;

  employeeNumber!: string;

  @ApiPropertyOptional({ nullable: true })
  licenseNumber!: string | null;
}
