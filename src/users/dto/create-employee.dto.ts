import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { EmployeeType } from '@/common/enums/userRoles.enum';
import { Transform } from 'class-transformer';

export class CreateEmployeeDto extends CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  employeeNumber!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;

    const lower = value.toLocaleLowerCase('es-ES');

    if (lower === EmployeeType.ADMIN.toLowerCase()) return lower;
    if (lower === EmployeeType.INSTRUCTOR.toLowerCase()) return lower;

    return value;
  })
  @IsEnum(EmployeeType, { message: 'Tipo de empleado inválido.' })
  employeeType!: EmployeeType;

  @ValidateIf(
    (o: CreateEmployeeDto) => o.employeeType === EmployeeType.INSTRUCTOR,
  )
  @IsString()
  @IsNotEmpty({
    message: 'El número de licencia es obligatorio para los instructores.',
  })
  licenseNumber?: string;
}
