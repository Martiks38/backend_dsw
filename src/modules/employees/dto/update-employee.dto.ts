import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class UpdateEmployeeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'El email no es válido' })
  @Length(5, 100, { message: 'El email debe tener entre 5 y 100 caracteres' })
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(7, 20, { message: 'El teléfono debe tener entre 7 y 20 caracteres' })
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Length(2, 50, { message: 'El nombre debe tener entre 2 y 50 caracteres' })
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Length(2, 50, { message: 'El apellido debe tener entre 2 y 50 caracteres' })
  lastName?: string;
}
