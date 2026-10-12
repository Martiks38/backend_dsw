import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const SINGLE_LINE = /^[^\r\n]*$/;

export class CreateContactDto {
  @Transform(trim)
  @IsString({ message: 'El nombre completo debe ser un texto.' })
  @IsNotEmpty({ message: 'El nombre completo es obligatorio.' })
  @MaxLength(100, {
    message: 'El nombre completo no puede superar los 100 caracteres.',
  })
  @Matches(SINGLE_LINE, {
    message: 'El nombre completo no puede contener saltos de línea.',
  })
  fullname!: string;

  @Transform(trim)
  @IsEmail({}, { message: 'Debes introducir un correo electrónico válido.' })
  @MaxLength(254, {
    message: 'El correo electrónico no puede superar los 254 caracteres.',
  })
  email!: string;

  @Transform(trim)
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto válido.' })
  @MaxLength(30, {
    message: 'El teléfono no puede superar los 30 caracteres.',
  })
  phone?: string;

  @Transform(trim)
  @IsString({ message: 'El asunto debe ser un texto.' })
  @IsNotEmpty({ message: 'El asunto es obligatorio.' })
  @MaxLength(150, {
    message: 'El asunto no puede superar los 150 caracteres.',
  })
  @Matches(SINGLE_LINE, {
    message: 'El asunto no puede contener saltos de línea.',
  })
  subject!: string;

  @Transform(trim)
  @IsString({ message: 'El mensaje debe ser un texto.' })
  @IsNotEmpty({ message: 'El mensaje es obligatorio.' })
  @MaxLength(256, {
    message: 'El mensaje no puede superar los 256 caracteres.',
  })
  message!: string;
}
