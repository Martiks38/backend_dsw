import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { getUserRole } from '@/common/utils/getUserRole.util';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt-strategy') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => (req.cookies?.access_token as string) ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: { sub: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { publicId: payload.sub },
      select: {
        publicId: true,
        isActive: true,
        employee: {
          select: {
            employeeType: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario inactivo o inexistente');
    }

    const role = getUserRole(user);

    return {
      publicId: user.publicId,
      role,
    };
  }
}
