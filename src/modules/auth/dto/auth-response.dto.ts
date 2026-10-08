import { ApiProperty } from '@nestjs/swagger';

import { AppRole } from '../role.enum';

export class LoginUserResponseDto {
  @ApiProperty({
    description: 'Identificador público del usuario',
    example: 'V1StGXR8_Z5jdHi6B-myT',
  })
  id!: string;

  @ApiProperty({ enum: AppRole, enumName: 'AppRole' })
  role!: AppRole;
}

export class LoginResponseDto {
  @ApiProperty({ type: LoginUserResponseDto })
  user!: LoginUserResponseDto;
}

export class AuthMeResponseDto {
  @ApiProperty({ enum: AppRole, enumName: 'AppRole' })
  role!: AppRole;
}
