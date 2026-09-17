import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'La contraseña actual debe ser un texto' })
  @IsNotEmpty({ message: 'La contraseña actual es obligatoria' })
  currentPassword!: string;

  @IsString({ message: 'La nueva contraseña debe ser un texto' })
  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria' })
  @Length(8, 50, {
    message: 'La nueva contraseña debe tener entre 6 y 50 caracteres',
  })
  newPassword!: string;
}
