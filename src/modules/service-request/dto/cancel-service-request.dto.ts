import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelServiceRequestDto {
  @IsOptional()
  @IsString({
    message: 'El motivo de cancelación debe ser un texto',
  })
  @MaxLength(500, {
    message: 'El motivo de cancelación no puede superar los 500 caracteres',
  })
  reason?: string;
}
