import { ApiProperty } from '@nestjs/swagger';

import { OperationType } from '@/generated/prisma/client';

export class BoatTypeDto {
  @ApiProperty() boatTypeId!: number;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: OperationType }) requiredOperation!: OperationType;
}
