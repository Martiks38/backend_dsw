import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'El token es obligatorio' })
  token!: string;

  @IsString()
  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria' })
  @Length(6, 50, {
    message: 'La contraseña debe tener entre 6 y 50 caracteres',
  })
  newPassword!: string;
}
