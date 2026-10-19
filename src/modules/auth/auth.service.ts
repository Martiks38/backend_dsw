import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';

import { getUserRole } from '@/common/utils/getUserRole.util';
import {
  comparePassword,
  hashPassword,
} from '@/common/utils/hashPassword.util';
import { PrismaService } from '@/prisma/prisma.service';

import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { userId: true, isActive: true },
    });

    if (!user || !user.isActive) return;

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.$transaction([
      // Un solo enlace vigente por usuario.
      this.prisma.passwordResetToken.updateMany({
        where: { userId: user.userId, used: false },
        data: { used: true },
      }),
      this.prisma.passwordResetToken.create({
        data: { userId: user.userId, tokenHash, expiresAt },
      }),
    ]);

    void this.mailService
      .sendPasswordReset(email, rawToken)
      .catch(() => undefined);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const passwordHash = await hashPassword(dto.newPassword);

    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.updateMany({
        where: { tokenHash, used: false, expiresAt: { gt: new Date() } },
        data: { used: true },
      });

      if (consumed.count === 0) {
        throw new BadRequestException(
          'El link de recuperación es inválido o expiró.',
        );
      }

      const { userId } = await tx.passwordResetToken.findUniqueOrThrow({
        where: { tokenHash },
        select: { userId: true },
      });

      await tx.user.update({
        where: { userId },
        data: { password: passwordHash },
      });

      await tx.passwordResetToken.updateMany({
        where: { userId, used: false },
        data: { used: true },
      });
    });
  }

  async validateCredentials(dto: LoginDto) {
    const ERROR_MESSAGE = 'Credenciales inválidas';

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
      throw new UnauthorizedException(ERROR_MESSAGE);
    }

    const validatePassword = await comparePassword(dto.password, user.password);

    if (!validatePassword) {
      throw new UnauthorizedException(ERROR_MESSAGE);
    }

    const role = getUserRole(user);

    return {
      id: user.publicId,
      role,
    };
  }

  async generateToken(publicId: string) {
    return await this.jwtService.signAsync({
      sub: publicId,
    });
  }
}
