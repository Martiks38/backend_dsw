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
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
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
      sameSite: 'lax',
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

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    return { message: 'Sesión cerrada' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
