import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { nanoid } from 'nanoid';

import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

import { AccountProvisioningService } from '../common/account-provisioning.service';
import { CreateClientDto } from './dto/create-client.dto';
import { FindClientsDto } from './dto/find-clients.dto';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provisioning: AccountProvisioningService,
  ) {}

  async create(dto: CreateClientDto) {
    const documentType = dto.type === 'business' ? 'CUIT' : 'DNI';

    const fieldErrors: Record<string, string[]> = {};

    const [emailTaken, documentTaken] = await Promise.all([
      this.prisma.user.findFirst({
        where: { email: dto.email },
        select: { userId: true },
      }),
      this.prisma.user.findFirst({
        where: { documentType, documentNumber: dto.documentNumber },
        select: { userId: true },
      }),
    ]);

    if (emailTaken)
      fieldErrors.email = ['El correo electrónico ya está registrado.'];
    if (documentTaken)
      fieldErrors.documentNumber = [
        'El número de documento ya está registrado.',
      ];

    if (Object.keys(fieldErrors).length > 0) {
      throw new ConflictException({
        message: 'Algunos datos ya están registrados.',
        fieldErrors,
      });
    }

    const tempPassword = this.provisioning.generateTempPassword();
    const passwordHash = await this.provisioning.hashTempPassword(tempPassword);

    try {
      const user = await this.prisma.user.create({
        data: {
          publicId: nanoid(),
          email: dto.email,
          password: passwordHash,
          phoneNumber: dto.phoneNumber,
          documentType,
          documentNumber: dto.documentNumber,
          isEmployee: false,
          member: {
            create:
              dto.type === 'business'
                ? { businessName: dto.businessName }
                : { firstName: dto.firstName, lastName: dto.lastName },
          },
        },
      });

      const name =
        dto.type === 'business'
          ? dto.businessName!
          : `${dto.firstName} ${dto.lastName}`;
      await this.provisioning.sendInvitation(user.email, name, tempPassword);

      return { success: true, publicId: user.publicId };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          message: 'Algunos datos ya están registrados.',
          fieldErrors: {
            general: ['Los datos ingresados ya están registrados.'],
          },
        });
      }
      throw error;
    }
  }

  async findAllOptions() {
    const members = await this.prisma.member.findMany({
      where: { user: { isActive: true } },
      include: { user: true },
      orderBy: { userId: 'asc' },
    });

    return members.map((m) => ({
      publicId: m.user.publicId,
      name: m.businessName ?? `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim(),
    }));
  }

  async getAllPaginated(dto: FindClientsDto) {
    const { page, limit, search, status } = dto;
    const skip = (page - 1) * limit;
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );

    const where: Prisma.MemberWhereInput = {
      user: {
        isActive: status ? status === 'active' : undefined,
        ...(search && {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            {
              member: {
                businessName: { contains: search, mode: 'insensitive' },
              },
            },
            {
              member: { firstName: { contains: search, mode: 'insensitive' } },
            },
            { member: { lastName: { contains: search, mode: 'insensitive' } } },
          ],
        }),
      },
    };

    const [data, total, active, inactive, newThisMonth] =
      await this.prisma.$transaction([
        this.prisma.member.findMany({
          where,
          skip,
          take: limit,
          orderBy: { userId: 'asc' },
          include: { user: true },
        }),
        this.prisma.member.count({ where }),
        this.prisma.member.count({ where: { user: { isActive: true } } }),
        this.prisma.member.count({ where: { user: { isActive: false } } }),
        this.prisma.member.count({
          where: { user: { createdAt: { gte: startOfMonth } } },
        }),
      ]);

    return {
      data: data.map((m) => ({
        displayId: m.userId,
        publicId: m.user.publicId,
        name:
          m.businessName ?? `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim(),
        email: m.user.email,
        phoneNumber: m.user.phoneNumber,
        isActive: m.user.isActive,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      stats: { total: active + inactive, active, inactive, newThisMonth },
    };
  }

  async setStatus(publicId: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { publicId },
      include: { member: true },
    });
    if (!user?.member) throw new NotFoundException('Cliente no encontrado');

    await this.prisma.user.update({ where: { publicId }, data: { isActive } });
    return { success: true };
  }
}
