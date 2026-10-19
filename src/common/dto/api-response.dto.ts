import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;
}

export class SuccessMessageResponseDto extends SuccessResponseDto {
  @ApiProperty({ example: 'Operación realizada correctamente.' })
  message!: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Operación realizada correctamente.' })
  message!: string;
}

export class CreatedResourceResponseDto extends SuccessResponseDto {
  @ApiProperty({
    description: 'Identificador público del recurso creado',
    example: 'V1StGXR8_Z5jdHi6B-myT',
  })
  publicId!: string;
}

export class PaginationMetaDto {
  @ApiProperty({
    description: 'Total de registros que cumplen el filtro',
    example: 57,
  })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 6 })
  totalPages!: number;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    description:
      'Mensaje de error. Es un arreglo cuando falla la validación del DTO.',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Usuario no encontrado',
  })
  message!: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error!: string;
}

export class ConflictFieldErrorsResponseDto {
  @ApiProperty({ example: 'Algunos datos ya están registrados.' })
  message!: string;

  @ApiProperty({
    description: 'Errores por campo',
    type: 'object',
    additionalProperties: { type: 'array', items: { type: 'string' } },
    example: { email: ['El correo electrónico ya está registrado.'] },
  })
  fieldErrors!: Record<string, string[]>;
}
