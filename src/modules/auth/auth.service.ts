import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { getUserRole } from '@/common/utils/getUserRole.util';
import { comparePassword } from '@/common/utils/hashPassword.util';
import { PrismaService } from '@/prisma/prisma.service';

import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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
