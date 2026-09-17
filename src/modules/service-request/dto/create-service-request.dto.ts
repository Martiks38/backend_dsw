import {
  ArrayMinSize,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const errorMessage = 'Solicitud de servicio incorrecta';

export class CreateServiceRequestDto {
  @IsString({ message: errorMessage })
  boatId!: string;

  @IsInt({ message: errorMessage, each: true })
  @ArrayMinSize(1)
  serviceTypeIds!: number[];

  @IsOptional()
  @IsString({ message: errorMessage })
  @MaxLength(500)
  observations?: string;
}
