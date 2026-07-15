import { ApiProperty } from '@nestjs/swagger';

export class MemberResponseDto {
  email!: string;

  phoneNumber!: string;

  publicId!: string;

  isActive!: boolean;

  @ApiProperty({ nullable: true })
  documentType!: string | null;

  @ApiProperty({ nullable: true })
  documentNumber!: string | null;

  @ApiProperty({ nullable: true })
  firstName!: string | null;

  @ApiProperty({ nullable: true })
  lastName!: string | null;

  @ApiProperty({ nullable: true })
  businessName!: string | null;
}
