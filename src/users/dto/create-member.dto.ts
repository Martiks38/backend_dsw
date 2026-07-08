import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class CreateMemberUserDto extends CreateUserDto {
  @IsString()
  @IsNotEmpty()
  documentType!: string;

  @IsString()
  @IsNotEmpty()
  documentNumber!: string;

  @ValidateIf((o: CreateMemberUserDto) => !o.businessName)
  @IsString()
  @IsNotEmpty({
    message: 'El nombre es obligatorio si no se especifica una razón social.',
  })
  firstName?: string;

  @ValidateIf((o: CreateMemberUserDto) => !o.businessName)
  @IsString()
  @IsNotEmpty({
    message: 'El apellido es obligatorio si no se especifica una razón social.',
  })
  lastName?: string;

  @ValidateIf((o: CreateMemberUserDto) => !o.firstName && !o.lastName)
  @IsString()
  @IsNotEmpty({
    message:
      'La razón social es obligatoria si no se ingresa nombre y apellido.',
  })
  businessName?: string;
}
