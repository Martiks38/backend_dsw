import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'El apellido debe ser un texto' })
  @MaxLength(100, {
    message: 'El apellido no puede superar los 100 caracteres',
  })
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: 'La razón social no puede superar los 100 caracteres',
  })
  businessName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'El número de teléfono debe ser un texto' })
  @MaxLength(30, {
    message: 'El número de teléfono no puede superar los 30 caracteres',
  })
  phoneNumber?: string;

  @IsOptional()
  @IsString({ message: 'El número de documento debe ser un texto' })
  @MaxLength(30, {
    message: 'El número de documento no puede superar los 30 caracteres',
  })
  documentNumber?: string;
}
