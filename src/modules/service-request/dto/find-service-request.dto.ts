import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

import { ServiceStatus } from '@/generated/prisma/enums';

export class FindServiceRequestDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser mayor o igual a 1' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser mayor o igual a 1' })
  @Max(100, { message: 'El límite no puede superar los 100 registros' })
  limit: number = 20;

  @IsOptional()
  @IsEnum(ServiceStatus, {
    message: 'El estado del servicio no es válido',
  })
  status?: ServiceStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'El tipo de servicio debe ser un número entero',
  })
  @Min(1, {
    message: 'El tipo de servicio debe ser mayor o igual a 1',
  })
  serviceTypeId?: number;

  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'La fecha desde debe tener un formato válido',
    },
  )
  from?: string;

  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'La fecha hasta debe tener un formato válido',
    },
  )
  until?: string;
}
