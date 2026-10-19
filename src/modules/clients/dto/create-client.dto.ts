import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

type ClientType = 'individual' | 'business';

interface CreateClientValidation {
  type: ClientType;
}

export class CreateClientDto {
  @IsIn(['individual', 'business'], {
    message: 'El tipo de cliente debe ser individual o business',
  })
  @IsNotEmpty({ message: 'El tipo de cliente es obligatorio' })
  type!: 'individual' | 'business';

  @ValidateIf((o: CreateClientValidation) => o.type === 'individual')
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100, {
    message: 'El nombre no puede superar los 100 caracteres',
  })
  firstName?: string;

  @ValidateIf((o: CreateClientValidation) => o.type === 'individual')
  @IsString({ message: 'El apellido debe ser un texto' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @MaxLength(100, {
    message: 'El apellido no puede superar los 100 caracteres',
  })
  lastName?: string;

  @ValidateIf((o: CreateClientValidation) => o.type === 'business')
  @IsString({ message: 'La razón social debe ser un texto' })
  @IsNotEmpty({ message: 'La razón social es obligatoria' })
  @MaxLength(150, {
    message: 'La razón social no puede superar los 150 caracteres',
  })
  businessName?: string;

  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  @MaxLength(100, {
    message: 'El email no puede superar los 100 caracteres',
  })
  email!: string;

  @IsString({ message: 'El teléfono debe ser un texto' })
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  @MinLength(6, {
    message: 'El teléfono debe tener al menos 6 caracteres',
  })
  @MaxLength(30, {
    message: 'El teléfono no puede superar los 30 caracteres',
  })
  phoneNumber!: string;

  @IsString({ message: 'El número de documento debe ser un texto' })
  @IsNotEmpty({ message: 'El número de documento es obligatorio' })
  @MaxLength(30, {
    message: 'El número de documento no puede superar los 30 caracteres',
  })
  documentNumber!: string;
}
