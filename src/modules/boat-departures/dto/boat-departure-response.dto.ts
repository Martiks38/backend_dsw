import { ApiProperty } from '@nestjs/swagger';

export class BoatDepartureResponseDto {
  @ApiProperty({ description: 'ID numérico del registro de salida' })
  boatDepartureId!: number;
  @ApiProperty({ description: 'Identificador público de la embarcación' })
  publicId!: string;
  @ApiProperty({ description: 'Fecha y hora de salida en ISO UTC' })
  exitedAt!: string;
  @ApiProperty({ description: 'Retorno estimado en ISO UTC' })
  estimatedReturnDatetime!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Retorno real en ISO UTC; null si el barco aún no regresó',
  })
  realReturnDatetime!: string | null;
}

export class ActiveBoatDepartureDto extends BoatDepartureResponseDto {
  @ApiProperty() boatName!: string;
  @ApiProperty() registrationNumber!: string;
  @ApiProperty() ownerName!: string;
}
