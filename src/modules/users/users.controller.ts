import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';

import { SuccessMessageResponseDto } from '@/common/dto/action-response.dto';

import { type AuthenticatedUser } from '../auth/auth.interface';
import { CurrentUser } from '../auth/decorators/currentUser.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  BusinessProfileDto,
  EmployeeProfileDto,
  IndividualProfileDto,
} from './dto/profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'No autenticado' })
@ApiExtraModels(EmployeeProfileDto, BusinessProfileDto, IndividualProfileDto)
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Perfil del usuario autenticado (la forma depende del campo type)',
  })
  @ApiOkResponse({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(EmployeeProfileDto) },
        { $ref: getSchemaPath(BusinessProfileDto) },
        { $ref: getSchemaPath(IndividualProfileDto) },
      ],
    },
  })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.internalId);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Actualiza los datos personales del usuario autenticado',
  })
  @ApiConflictResponse({
    description:
      'Email o documento ya registrados; incluye fieldErrors por campo',
  })
  @ApiOkResponse({ type: SuccessMessageResponseDto })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.internalId, dto);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Cambia la contraseña del usuario autenticado' })
  @ApiForbiddenResponse({ description: 'La contraseña actual es incorrecta' })
  @ApiOkResponse({ type: SuccessMessageResponseDto })
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.internalId, dto);
  }
}
