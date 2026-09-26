import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { ServiceStatus } from '@/generated/prisma/enums';

export class UpdateServiceRequestDto {
  @IsOptional()
  @IsIn([ServiceStatus.IN_PROGRESS, ServiceStatus.COMPLETED])
  status?: 'IN_PROGRESS' | 'COMPLETED';

  @IsOptional()
  @IsString({ message: 'El comentario interno debe ser un texto' })
  @MaxLength(1000, {
    message: 'El comentario interno no puede superar los 1000 caracteres',
  })
  internalComment?: string;

  @IsOptional()
  @IsDateString()
  estimatedReturnDatetime?: string;
}
