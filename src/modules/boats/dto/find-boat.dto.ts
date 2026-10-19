import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class FindBoatsDto {
  @IsString({ message: 'La búsqueda debe ser un texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty({ message: 'La búsqueda es obligatoria' })
  @MaxLength(100, {
    message: 'La búsqueda no puede superar los 100 caracteres',
  })
  search!: string;
}

export class BoatSearchResultDto {
  @ApiProperty({ description: 'Identificador público de la embarcación' })
  publicId!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() model?: string;
  @ApiProperty() registrationNumber!: string;
  @ApiProperty() ownerName!: string;
}
