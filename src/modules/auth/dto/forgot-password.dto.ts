import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email!: string;
}
