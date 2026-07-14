import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { nanoid } from 'nanoid';
import { handlePrismaError } from '@/common/utils/handlePrismaError.util';
import {
  CreateMemberDto,
  CreateMemberResponseDto,
  UpdateMemberDto,
  UpdateMemberResponseDto,
} from './dto';
import { memberSelect } from './member.types';
import { MessageResponseDto } from '@/common/dto/message-response.dto';
import { hashPassword } from '@/common/utils/hashPassword.util';
import { Prisma, User } from '@/generated/prisma/client';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(private prisma: PrismaService) {}
  async create(
    createMemberDto: CreateMemberDto,
  ): Promise<CreateMemberResponseDto> {
    const { email, documentNumber, documentType, password } = createMemberDto;

    await this.assertIsUnique(email, documentType, documentNumber);

    const hashedPassword = await hashPassword(password);

    const result = await this.createUserAndMember({
      ...createMemberDto,
      password: hashedPassword,
    });

    this.logger.log(`Socio creado: publicId=${result.publicId}`);
    return result;
  }

  async findOne(publicId: string) {
    const member = await this.prisma.member.findFirst({
      where: {
        user: {
          publicId,
        },
      },
      select: memberSelect,
    });

    if (!member) {
      this.logger.warn(`Socio no encontrado: publicId=${publicId}`);
      throw new NotFoundException(`No se encontró el socio con id ${publicId}`);
    }

    const { user, ...rest } = member;

    return { ...rest, ...user };
  }

  async update(
    publicId: string,
    updateMemberDto: UpdateMemberDto,
  ): Promise<UpdateMemberResponseDto> {
    const existingMember = await this.prisma.member.findFirst({
      where: {
        user: {
          publicId,
        },
      },
    });

    if (!existingMember) {
      throw new NotFoundException(`No se encontró el socio con id ${publicId}`);
    }

    const isBusiness = existingMember.businessName !== null;

    this.validateMemberTypeConsistency(isBusiness, updateMemberDto);

    const userData: Prisma.UserUpdateInput = {};
    const memberData: Prisma.MemberUpdateInput = {};

    const USER_FIELDS = new Set<string>(
      Object.values(Prisma.UserScalarFieldEnum),
    );
    const MEMBER_FIELDS = new Set<string>(
      Object.values(Prisma.MemberScalarFieldEnum),
    );

    for (const key of Object.keys(updateMemberDto) as Array<
      keyof UpdateMemberDto
    >) {
      const value = updateMemberDto[key];
      if (value === undefined) continue;

      if (USER_FIELDS.has(key)) {
        (userData as Record<string, unknown>)[key] = value;
      } else if (MEMBER_FIELDS.has(key)) {
        (memberData as Record<string, unknown>)[key] = value;
      }
    }

    const { userId } = existingMember;
    await this.checkUniqueConstraints(userId, userData);

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (Object.keys(memberData).length > 0) {
          await tx.member.update({ where: { userId }, data: memberData });
        }
        if (Object.keys(userData).length > 0) {
          await tx.user.update({ where: { userId }, data: userData });
        }

        const updatedUser = await tx.user.findUniqueOrThrow({
          where: { userId },
          include: { member: true },
        });

        const response: UpdateMemberResponseDto = {
          publicId: updatedUser.publicId,
          email: updatedUser.email,
          phoneNumber: updatedUser.phoneNumber,
          firstName: updatedUser.member?.firstName ?? null,
          lastName: updatedUser.member?.lastName ?? null,
          businessName: updatedUser.member?.businessName ?? null,
        };

        return response;
      });
    } catch (error) {
      handlePrismaError(
        error,
        this.logger,
        'actualizar socio',
        'El email ya está registrado',
      );
    }
  }

  async remove(publicId: string): Promise<MessageResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { publicId } });

    if (!user || !user.isActive) {
      this.logger.warn(`Socio no encontrado: publicId=${publicId}`);
      throw new NotFoundException(`No se encontró el socio con id ${publicId}`);
    }

    await this.prisma.user.update({
      where: { userId: user.userId },
      data: { isActive: false },
    });

    this.logger.log(`Socio actualizado: userId=${user.userId}`);

    return {
      success: true,
      message: `Socio con id ${publicId} fue eliminado exitosamente`,
    };
  }

  private async assertIsUnique(
    email: string,
    documentType: string,
    documentNumber: string,
  ): Promise<void> {
    const conflicts = await this.prisma.user.findMany({
      where: {
        OR: [{ email }, { documentType, documentNumber }],
      },
      select: { email: true, documentType: true, documentNumber: true },
    });

    const errors: string[] = [];

    conflicts.some((u) => {
      if (u.email === email) {
        errors.push('El email ya está registrado');
      }
    });
    conflicts.some((u) => {
      if (
        u.documentType === documentType &&
        u.documentNumber === documentNumber
      ) {
        errors.push(
          'Ya existe un socio registrado con ese tipo y número de documento',
        );
      }
    });

    if (errors.length > 0) {
      this.logger.warn(`Intento de creación duplicado: ${errors.join(', ')}`);
      throw new ConflictException(errors);
    }
  }

  private async createUserAndMember(
    data: CreateMemberDto,
  ): Promise<CreateMemberResponseDto> {
    const {
      businessName,
      documentType,
      documentNumber,
      email,
      firstName,
      lastName,
      password,
      phoneNumber,
    } = data;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            /** Generación de "publicId"
             * nanoid genera IDs sobre un alfabeto de 64 caracteres,
             * resultando en aproximadamente 6.4x10^17 combinaciones posibles.
             * Por lo que, recien al generar aproximadamente 150 millones de
             * usuarios, se alcanzaría una probabilidad de colisión del 1%.
             * P≈1-e^(-k^2/(2N))
             *
             * Se omite la implementación de reintento ante una posible
             * colisión de publicId debido a que no se manejará tal volumen
             * de usuarios en este proyecto
             */
            publicId: nanoid(10),
            email: email,
            password,
            documentType,
            documentNumber,
            phoneNumber,
            isEmployee: false,
          },
        });

        const member = await tx.member.create({
          data: {
            userId: user.userId,
            firstName,
            lastName,
            businessName,
          },
        });

        const response: CreateMemberResponseDto = {
          publicId: user.publicId,
          email: user.email,
          phoneNumber: user.phoneNumber,
          documentType: user.documentType,
          documentNumber: user.documentNumber,
          firstName: member.firstName,
          lastName: member.lastName,
          businessName: member.businessName,
        };

        return response;
      });
    } catch (error) {
      handlePrismaError(
        error,
        this.logger,
        'crear socio',
        'El email o el documento ya están registrados',
      );
    }
  }

  private validateMemberTypeConsistency(
    isBusiness: boolean,
    dto: UpdateMemberDto,
  ) {
    const errors: string[] = [];

    if (isBusiness) {
      if (dto.firstName !== undefined || dto.lastName !== undefined) {
        errors.push('Una empresa no puede tener nombre y apellido');
      }

      if (dto.businessName === null) {
        errors.push('No se puede borrar la razón social de una empresa');
      }
    } else {
      if (dto.businessName !== undefined) {
        errors.push('Una persona no puede tener razón social');
      }

      if (dto.firstName === null || dto.lastName === null) {
        errors.push('No se puede borrar el nombre o apellido de un socio');
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }
  }

  private async checkUniqueConstraints(
    userId: number,
    userData: Prisma.UserUpdateInput,
  ) {
    const errors: string[] = [];
    let existingUser: User | null;

    if (typeof userData.email === 'string') {
      existingUser = await this.prisma.user.findFirst({
        where: {
          email: userData.email,
          userId: {
            not: userId,
          },
        },
      });

      if (existingUser) {
        errors.push('El email ya está registrado');
      }
    }

    if (errors.length > 0) {
      throw new ConflictException(errors);
    }
  }
}
