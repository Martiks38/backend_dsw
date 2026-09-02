import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { getDisplayName } from '@/common/utils/getUserName.util';
import { getUserRole } from '@/common/utils/getUserRole.util';
import { PrismaService } from '@/prisma/prisma.service';

import type { AuthenticatedUser } from '../auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => (req.cookies?.access_token as string) ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: { sub: string }): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { publicId: payload.sub },
      select: {
        publicId: true,
        isActive: true,
        employee: {
          select: { employeeType: true, firstName: true, lastName: true },
        },
        member: {
          select: { firstName: true, lastName: true, businessName: true },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario inactivo o inexistente');
    }

    return {
      sub: user.publicId,
      role: getUserRole(user),
      name: getDisplayName(user),
    };
  }
}
