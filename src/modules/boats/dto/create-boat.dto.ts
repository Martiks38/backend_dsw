import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBoatDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  name!: string;

  @IsString({ message: 'El modelo debe ser un texto' })
  @IsNotEmpty({ message: 'El modelo es obligatorio' })
  @MaxLength(100, { message: 'El modelo no puede superar los 100 caracteres' })
  model!: string;

  @IsString({ message: 'La matrícula debe ser un texto' })
  @MinLength(1, { message: 'La matrícula debe tener al menos 1 carácter' })
  @MaxLength(30, {
    message: 'La matrícula no puede superar los 30 caracteres',
  })
  registrationNumber!: string;

  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(500, {
    message: 'La descripción no puede superar los 500 caracteres',
  })
  description!: string;

  @IsInt({ message: 'El tipo de embarcación debe ser un número entero' })
  boatTypeId!: number;

  @IsString({ message: 'El propietario debe ser un texto' })
  @IsNotEmpty({ message: 'El propietario es obligatorio' })
  ownerPublicId!: string;

  @IsInt({ message: 'La cuna debe ser un número entero' })
  cradleId!: number;

  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida' })
  startDatetime!: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de finalización debe ser una fecha válida' },
  )
  plannedEndDate?: string;
}
