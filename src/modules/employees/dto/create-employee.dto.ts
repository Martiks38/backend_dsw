import { EmployeeType } from '@/common/enums/employee-type.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsEmail, Length, IsString, ValidateIf, IsEnum } from 'class-validator';

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

  @Transform(({ value }: TransformFnParams) => {
    const val: unknown = value;
    return typeof val === 'string' ? val.trim().toLowerCase() : val;
  })
  @IsEnum(EmployeeType, { message: 'El tipo de empleado no es válido' })
  employeeType!: EmployeeType;

  @ApiPropertyOptional({
    description: 'Requerido si el tipo de empleado es Instructor',
  })
  @ValidateIf(
    (e: CreateEmployeeDto) => e.employeeType === EmployeeType.INSTRUCTOR,
  )
  @Length(6, 45, {
    message: 'El número de licencia debe tener entre 6 y 45 caracteres',
  })
  licenseNumber?: string;
}
