import { ApiProperty } from '@nestjs/swagger';

import { AppRole } from '../role.enum';

export class AuthUserDto {
  @ApiProperty({ description: 'Identificador público' }) id!: string;
  @ApiProperty({ enum: AppRole }) role!: AppRole;
}

export class LoginResponseDto {
  @ApiProperty({ type: AuthUserDto }) user!: AuthUserDto;
}

export class MeResponseDto extends AuthUserDto {
  @ApiProperty() name!: string;
}
