import { ApiProperty } from '@nestjs/swagger';

export class ServiceTypeOptionDto {
  @ApiProperty() serviceTypeId!: number;
  @ApiProperty() name!: string;
}
