import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEmail, Length, IsString } from 'class-validator';

export class UpdateEmployeeDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail({}, { message: 'El email no es válido' })
  @Length(5, 100, { message: 'El email debe tener entre 5 y 100 caracteres' })
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(7, 20, { message: 'El teléfono debe tener entre 7 y 20 caracteres' })
  phoneNumber?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @Length(2, 50, { message: 'El nombre debe tener entre 2 y 50 caracteres' })
  firstName?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @Length(2, 50, { message: 'El apellido debe tener entre 2 y 50 caracteres' })
  lastName?: string | null;
}
