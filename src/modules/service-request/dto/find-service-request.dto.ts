import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { ServiceStatus } from '@/generated/prisma/enums';

export class FindServiceRequestDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'La página debe ser un número entero',
  })
  @Min(1, {
    message: 'La página debe ser mayor o igual a 1',
  })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'El límite debe ser un número entero',
  })
  @Min(1, {
    message: 'El límite debe ser mayor o igual a 1',
  })
  @Max(100, {
    message: 'El límite no puede ser mayor a 100',
  })
  limit: number = 20;

  @IsOptional()
  @IsEnum(ServiceStatus, {
    message: 'El estado del servicio no es válido',
  })
  status?: ServiceStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'El ID del tipo de servicio debe ser un número entero',
  })
  serviceTypeId?: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha desde no es válida' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha hasta no es válida' })
  until?: string;

  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser un texto' })
  @MaxLength(100, {
    message: 'La búsqueda no puede superar los 100 caracteres',
  })
  search?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @IsArray()
  @IsEnum(ServiceStatus, { each: true })
  statuses?: ServiceStatus[];
}
