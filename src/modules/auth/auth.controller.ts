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
import type { CookieOptions, Response } from 'express';

import type { AuthenticatedRequest } from './auth.interface';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
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
      cookieOptions.maxAge = 1000 * 60 * 60 * 24; // 1 día
    }

    res.cookie('access_token', token, cookieOptions);

    return { user };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return {
      message: 'Si el email existe, vas a recibir un correo con instrucciones.',
    };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return { message: 'Contraseña actualizada correctamente.' };
  }
}
