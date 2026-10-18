import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBoatDepartureDto {
  @IsString({ message: 'El identificador público debe ser un texto' })
  @IsNotEmpty({ message: 'El identificador público es obligatorio' })
  publicId!: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'El retorno estimado debe tener un formato de fecha válido' },
  )
  estimatedReturnDatetime?: string;
}
