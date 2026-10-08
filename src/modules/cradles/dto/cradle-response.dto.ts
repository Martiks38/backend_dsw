import { ApiProperty } from '@nestjs/swagger';

export class CradleDto {
  @ApiProperty() cradleId!: number;
  @ApiProperty({ example: 'C-009' }) cradleCode!: string;
  @ApiProperty() state!: string;
}
