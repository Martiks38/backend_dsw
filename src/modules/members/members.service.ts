import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import { nanoid } from 'nanoid';
import { handlePrismaError } from '@/common/utils/handlePrismaError';
import {
  CreateMemberDto,
  CreateMemberResponseDto,
  UpdateMemberDto,
  UpdateMemberResponseDto,
} from './dto';
import { memberSelect } from './member.types';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(private prisma: PrismaService) {}
  async create(
    createMemberDto: CreateMemberDto,
  ): Promise<CreateMemberResponseDto> {
    const { email, documentNumber, documentType, password } = createMemberDto;

    await this.assertIsUnique(email, documentType, documentNumber);

    const hashedPassword = await bcrypt.hash(password, 10);

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

    const userId = existingMember.userId;

    const { email, documentType, documentNumber, phoneNumber, ...memberData } =
      updateMemberDto;

    const errors: string[] = [];

    if (email) {
      const emailOwner = await this.prisma.user.findUnique({
        where: { email },
      });
      if (emailOwner && emailOwner.userId !== userId) {
        errors.push('El email ya está registrado por otro usuario');
      }
    }

    if (documentType && documentNumber) {
      const documentOwner = await this.prisma.member.findUnique({
        where: {
          documentType_documentNumber: { documentType, documentNumber },
        },
      });
      if (documentOwner && documentOwner.userId !== userId) {
        errors.push(
          'Ya existe un socio registrado con ese tipo y número de documento',
        );
      }
    }

    if (errors.length > 0) {
      throw new ConflictException(errors);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (email || phoneNumber) {
          await tx.user.update({
            where: { userId },
            data: { email, phoneNumber },
          });
        }

        const member = await tx.member.update({
          where: { userId },
          data: { documentType, documentNumber, ...memberData },
        });

        const user = await tx.user.findUniqueOrThrow({
          where: { userId },
          select: {
            publicId: true,
            email: true,
            phoneNumber: true,
            isActive: true,
          },
        });

        this.logger.log(`Socio actualizado: userId=${userId}`);

        const response: UpdateMemberResponseDto = {
          email: user.email,
          publicId: user.publicId,
          phoneNumber: user.phoneNumber,
          isActive: user.isActive,
          documentNumber: member.documentNumber,
          documentType: member.documentType,
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
        'actualizar socio',
        'El email o el documento ya están registrados',
      );
    }
  }

  async remove(publicId: string): Promise<Record<'message', string>> {
    const user = await this.prisma.user.findUnique({ where: { publicId } });

    if (!user) {
      this.logger.warn(`Socio no encontrado: publicId=${publicId}`);
      throw new NotFoundException(`No se encontró el socio con id ${publicId}`);
    }

    await this.prisma.user.update({
      where: { userId: user.userId },
      data: { isActive: false },
    });

    this.logger.log(`Socio actualizado: userId=${user.userId}`);

    return {
      message: `Socio con id ${publicId} fue eliminado correctamente`,
    };
  }

  private async assertIsUnique(
    email: string,
    documentType: string,
    documentNumber: string,
  ): Promise<void> {
    const [existingUser, existingDocument] = await Promise.all([
      this.prisma.user.findUnique({ where: { email } }),
      this.prisma.member.findUnique({
        where: {
          documentType_documentNumber: { documentType, documentNumber },
        },
      }),
    ]);

    const errors: string[] = [];

    if (existingUser) {
      errors.push('El email ya está registrado');
    }

    if (existingDocument) {
      errors.push(
        'Ya existe un socio registrado con ese tipo y número de documento',
      );
    }

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
            phoneNumber,
            isEmployee: false,
          },
        });

        const member = await tx.member.create({
          data: {
            userId: user.userId,
            documentType,
            documentNumber,
            firstName,
            lastName,
            businessName,
          },
        });

        const response: CreateMemberResponseDto = {
          publicId: user.publicId,
          email: user.email,
          phoneNumber: user.phoneNumber,
          documentType: member.documentType,
          documentNumber: member.documentNumber,
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
}
