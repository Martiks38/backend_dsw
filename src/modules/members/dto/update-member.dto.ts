import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class UpdateMemberDto {
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

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Length(2, 50, { message: 'El nombre debe tener entre 2 y 50 caracteres' })
  firstName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Length(2, 50, { message: 'El apellido debe tener entre 2 y 50 caracteres' })
  lastName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Length(3, 100, {
    message: 'La razón social debe tener entre 3 y 100 caracteres',
  })
  businessName?: string | null;
}
