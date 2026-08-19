import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

import { getUserRole } from '@/common/utils/getUserRole.util';
import {
  comparePassword,
  hashPassword,
} from '@/common/utils/hashPassword.util';
import { PrismaService } from '@/prisma/prisma.service';

import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async requestPasswordReset(email: string) {
    const responseMessage = 'Se ha enviado un email a su correo';
    const user = await this.prisma.user.findUnique({ where: { email } });

    // No revela si el email existe o está inhabilitado
    if (!user || !user.isActive) {
      return { message: responseMessage };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    });

    await this.mailService.sendPasswordReset(user.email, rawToken);

    return { message: responseMessage };
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetToken) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    const hashedPassword = await hashPassword(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { userId: resetToken.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { passwordResetTokenId: resetToken.passwordResetTokenId },
        data: { used: true },
      }),
    ]);

    return { message: 'Contraseña actualizada' };
  }

  async validateCredentials(dto: LoginDto) {
    const message = 'Credenciales inválidas';

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        publicId: true,
        password: true,
        isActive: true,
        employee: {
          select: {
            employeeType: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException(message);
    }

    const validatePassword = await comparePassword(dto.password, user.password);

    if (!validatePassword) {
      throw new UnauthorizedException(message);
    }

    const role = getUserRole(user);

    return {
      id: user.publicId,
      role,
    };
  }

  generateToken(user: { id: string; role: string }) {
    return this.jwtService.sign({
      sub: user.id,
      role: user.role,
    });
  }
}
