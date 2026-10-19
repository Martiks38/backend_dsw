import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  firstName!: string;

  @IsString({ message: 'El apellido debe ser un texto' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @MaxLength(100, {
    message: 'El apellido no puede superar los 100 caracteres',
  })
  lastName!: string;

  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  @MaxLength(100, { message: 'El email no puede superar los 100 caracteres' })
  email!: string;

  @IsString({ message: 'El teléfono debe ser un texto' })
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  @MinLength(6, { message: 'El teléfono debe tener al menos 6 caracteres' })
  @MaxLength(30, { message: 'El teléfono no puede superar los 30 caracteres' })
  phoneNumber!: string;

  @IsString({ message: 'El número de documento debe ser un texto' })
  @IsNotEmpty({ message: 'El número de documento es obligatorio' })
  @MaxLength(30, {
    message: 'El número de documento no puede superar los 30 caracteres',
  })
  documentNumber!: string;

  @IsIn(['ADMIN', 'OPERATOR'], {
    message: 'El tipo de empleado debe ser ADMIN u OPERATOR',
  })
  @IsNotEmpty({ message: 'El tipo de empleado es obligatorio' })
  employeeType!: 'ADMIN' | 'OPERATOR';
}
