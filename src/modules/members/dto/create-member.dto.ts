import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, ValidateIf } from 'class-validator';

export class CreateMemberDto {
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

  @ApiProperty({
    required: false,
    description: 'Requerido si no se envía businessName',
  })
  @ValidateIf((o: CreateMemberDto) => !o.businessName)
  @Length(2, 50, { message: 'El nombre debe tener entre 2 y 50 caracteres' })
  firstName?: string;

  @ApiProperty({
    required: false,
    description: 'Requerido si no se envía businessName',
  })
  @ValidateIf((o: CreateMemberDto) => !o.businessName)
  @Length(2, 50, { message: 'El apellido debe tener entre 2 y 50 caracteres' })
  lastName?: string;

  @ApiProperty({
    required: false,
    description: ' Requerido si no se envían firstName y lastName',
  })
  @ValidateIf((o: CreateMemberDto) => !o.firstName && !o.lastName)
  @Length(3, 100, {
    message: 'La razón social debe tener entre 3 y 100 caracteres',
  })
  businessName?: string;
}
