import { IsEmail, IsEnum, IsString, Length } from 'class-validator';

import { EmployeeType } from '@/generated/prisma/enums';

export class CreateEmployeeDto {
  @IsEmail({}, { message: 'El email no es válido' })
  @Length(5, 100, { message: 'El email debe tener entre 5 y 100 caracteres' })
  email!: string;

  @IsString()
  @Length(6, 50, {
    message: 'La contraseña debe tener entre 6 y 50 caracteres',
  })
  password!: string;

  @IsString()
  @Length(7, 20, { message: 'El teléfono debe tener entre 7 y 20 caracteres' })
  phoneNumber!: string;

  @IsString()
  @Length(2, 20, {
    message: 'El tipo de documento debe tener entre 2 y 20 caracteres',
  })
  documentType!: string;

  @IsString()
  @Length(6, 20, {
    message: 'El número de documento debe tener entre 6 y 20 caracteres',
  })
  documentNumber!: string;

  @IsString()
  @Length(2, 50, { message: 'El nombre debe tener entre 2 y 50 caracteres' })
  firstName!: string;

  @IsString()
  @Length(2, 50, { message: 'El apellido debe tener entre 2 y 50 caracteres' })
  lastName!: string;

  @IsEnum(EmployeeType, { message: 'El tipo de empleado no es válido' })
  employeeType!: EmployeeType;
}
