import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { CookieOptions, Response } from 'express';

import { MessageOnlyResponseDto } from '@/common/dto/action-response.dto';

import type { AuthenticatedRequest } from './auth.interface';
import { AuthService } from './auth.service';
import { LoginResponseDto, MeResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Inicia sesión y setea la cookie httpOnly access_token',
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciales inválidas o usuario inactivo',
  })
  @ApiOkResponse({ type: LoginResponseDto })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateCredentials(loginDto);
    const token = await this.authService.generateToken(user.id);

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    };

    if (loginDto.remember) {
      cookieOptions.maxAge = 1000 * 60 * 60 * 24;
    }

    res.cookie('access_token', token, cookieOptions);

    return { user };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Datos básicos del usuario autenticado' })
  @ApiUnauthorizedResponse({ description: 'No autenticado' })
  @ApiOkResponse({ type: MeResponseDto })
  getProfile(@Req() req: AuthenticatedRequest) {
    const { id, role, name } = req.user; // sin internalId
    return { id, role, name };
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Solicita el email de restablecimiento de contraseña',
  })
  @ApiOkResponse({
    type: MessageOnlyResponseDto,
    description: 'Siempre responde OK, exista o no el email',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return {
      message: 'Si el email existe, vas a recibir un correo con instrucciones.',
    };
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Restablece la contraseña con el token recibido por email',
  })
  @ApiBadRequestResponse({ description: 'Token inválido, usado o expirado' })
  @ApiOkResponse({ type: MessageOnlyResponseDto })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return { message: 'Contraseña actualizada correctamente.' };
  }
}
