import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMemberResponseDto {
  publicId!: string;

  email!: string;

  phoneNumber!: string;

  @ApiPropertyOptional({ nullable: true })
  documentType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  documentNumber!: string | null;

  @ApiPropertyOptional({ nullable: true })
  firstName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  businessName!: string | null;
}
