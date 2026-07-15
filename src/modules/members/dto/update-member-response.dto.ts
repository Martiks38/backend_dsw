import { ApiProperty } from '@nestjs/swagger';

export class UpdateMemberResponseDto {
  publicId!: string;

  email!: string;

  phoneNumber!: string;

  @ApiProperty({ nullable: true })
  firstName!: string | null;

  @ApiProperty({ nullable: true })
  lastName!: string | null;

  @ApiProperty({ nullable: true })
  businessName!: string | null;
}
