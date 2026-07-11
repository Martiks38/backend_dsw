import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({
    example: true,
  })
  success!: boolean;
  @ApiProperty({
    example: 'Socio con id 1234567890 fue eliminado correctamente',
  })
  message!: string;
}
