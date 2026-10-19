import { IsOptional, IsString, MaxLength } from 'class-validator';

export class FindActiveBoatDeparturesDto {
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser un texto' })
  @MaxLength(100, {
    message: 'La búsqueda no puede superar los 100 caracteres',
  })
  search?: string;

  @IsOptional()
  @IsString({ message: 'El identificador público debe ser un texto' })
  publicId?: string;
}
