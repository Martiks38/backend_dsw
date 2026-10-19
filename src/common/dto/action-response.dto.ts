import { ApiProperty } from '@nestjs/swagger';

export class ActionResponseDto {
  @ApiProperty() success!: boolean;
}

export class SuccessMessageResponseDto extends ActionResponseDto {
  @ApiProperty() message!: string;
}

export class MessageOnlyResponseDto {
  @ApiProperty() message!: string;
}

export class CreatedResourceResponseDto extends ActionResponseDto {
  @ApiProperty({ description: 'Identificador público del recurso creado' })
  publicId!: string;
}
