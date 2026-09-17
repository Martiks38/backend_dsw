import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { hashPassword } from '@/common/utils/hashPassword.util';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: { member: true, employee: true },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (user.employee) {
      return {
        type: 'employee',
        firstName: user.employee.firstName,
        lastName: user.employee.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.employee.employeeType,
        joinedAtLabel: user.createdAt.toLocaleDateString('es-AR'),
      };
    }

    if (user.member?.businessName) {
      return {
        type: 'business',
        businessName: user.member.businessName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        documentNumber: user.documentNumber,
      };
    }

    return {
      type: 'individual',
      firstName: user.member?.firstName ?? '',
      lastName: user.member?.lastName ?? '',
      email: user.email,
      phoneNumber: user.phoneNumber,
      documentNumber: user.documentNumber,
    };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: { member: true },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado.');
    }

    const fieldErrors: Record<string, string[]> = {};

    const [emailTaken, documentTaken] = await Promise.all([
      dto.email && dto.email !== user.email
        ? this.prisma.user.findFirst({
            where: { email: dto.email, userId: { not: userId } },
            select: { userId: true },
          })
        : null,
      dto.documentNumber && dto.documentNumber !== user.documentNumber
        ? this.prisma.user.findFirst({
            where: {
              documentType: user.documentType,
              documentNumber: dto.documentNumber,
              userId: { not: userId },
            },
            select: { userId: true },
          })
        : null,
    ]);

    if (emailTaken) {
      fieldErrors.email = ['El correo electrónico ya está registrado.'];
    }
    if (documentTaken) {
      fieldErrors.documentNumber = [
        'El número de documento ya está registrado.',
      ];
    }

    if (Object.keys(fieldErrors).length > 0) {
      throw new ConflictException({
        message: 'Algunos datos ya están registrados.',
        fieldErrors,
      });
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { userId },
          data: {
            email: dto.email,
            phoneNumber: dto.phoneNumber,
            documentNumber: dto.documentNumber,
          },
        });

        if (user.member) {
          const memberData = user.member.businessName
            ? { businessName: dto.businessName }
            : { firstName: dto.firstName, lastName: dto.lastName };

          await tx.member.update({ where: { userId }, data: memberData });
        }
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = error.meta?.target;
        let fields: string[] = [];

        if (Array.isArray(target)) {
          fields = target.filter((f): f is string => typeof f === 'string');
        } else if (typeof target === 'string') {
          fields = [target];
        }

        const raceErrors: Record<string, string[]> = {};

        if (fields.some((f) => f.includes('email'))) {
          raceErrors.email = ['El correo electrónico ya está registrado.'];
        }
        if (fields.some((f) => f.includes('document'))) {
          raceErrors.documentNumber = [
            'El número de documento ya está registrado.',
          ];
        }

        throw new ConflictException({
          message: 'Algunos datos ya están registrados.',
          fieldErrors:
            Object.keys(raceErrors).length > 0
              ? raceErrors
              : { general: ['Los datos ingresados ya están registrados.'] },
        });
      }
      throw error;
    }

    return { success: true, message: 'Tus datos han sido actualizados.' };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { userId } });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado.');
    }

    const matches = await bcrypt.compare(dto.currentPassword, user.password);
    if (!matches) {
      throw new ForbiddenException('La contraseña actual es incorrecta');
    }

    await this.prisma.user.update({
      where: { userId },
      data: { password: await hashPassword(dto.newPassword) },
    });

    return { success: true, message: 'Tu contraseña ha sido actualizada.' };
  }
}
