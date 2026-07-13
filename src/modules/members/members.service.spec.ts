jest.mock('@/common/utils/hashPassword.util');
jest.mock('nanoid', () => ({
  nanoid: jest.fn(),
}));

import { nanoid } from 'nanoid';
import { Test, TestingModule } from '@nestjs/testing';
import { MembersService } from './members.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RawMemberWithUser } from './member.types';
import {
  CreateMemberDto,
  CreateMemberResponseDto,
  UpdateMemberResponseDto,
} from './dto';
import { hashPassword } from '@/common/utils/hashPassword.util';

describe('MembersService', () => {
  let service: MembersService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    member: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('debería lanzar NotFoundException si el socio no existe', async () => {
      mockPrismaService.member.findFirst.mockResolvedValue(null);

      await expect(service.findOne('publicId-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería devolver el socio combinando datos de user y member', async () => {
      const mockRawMember: RawMemberWithUser = {
        firstName: 'Juan',
        lastName: 'Pérez',
        businessName: null,
        user: {
          publicId: 'abc123',
          email: 'juan@test.com',
          documentType: 'DNI',
          documentNumber: '12345678',
          phoneNumber: '3411234567',
          isActive: true,
        },
      };

      mockPrismaService.member.findFirst.mockResolvedValue(mockRawMember);

      const result = await service.findOne('abc123');

      const { user, ...rest } = mockRawMember;

      expect(result).toEqual({
        ...rest,
        ...user,
      });
    });
  });

  describe('create', () => {
    const newMember: CreateMemberDto = {
      email: 'test@test.com',
      password: 'password',
      documentType: 'DNI',
      documentNumber: '12345678',
      firstName: 'Pepe',
      lastName: 'Pepito',
      phoneNumber: '3411234567',
    };

    beforeEach(() => {
      mockPrismaService.$transaction.mockImplementation(
        async (cb: (tx: typeof mockPrismaService) => Promise<unknown>) =>
          cb(mockPrismaService),
      );
    });

    it('debería crear el usuario y el socio correctamente', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const mockPasswordHashed = 'hashedPassword';
      const mockPublicId = 'publicId123';

      (hashPassword as jest.Mock).mockResolvedValue(mockPasswordHashed);
      (nanoid as jest.Mock).mockReturnValue(mockPublicId);

      mockPrismaService.user.create.mockResolvedValue({
        ...newMember,
        userId: 1,
        publicId: mockPublicId,
        password: mockPasswordHashed,
        isActive: true,
        isEmployee: false,
      });

      mockPrismaService.member.create.mockResolvedValue({
        userId: 1,
        firstName: newMember.firstName,
        lastName: newMember.lastName,
        businessName: null,
      });

      const result = await service.create(newMember);

      expect(hashPassword).toHaveBeenCalledWith(newMember.password);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          documentType: newMember.documentType,
          documentNumber: newMember.documentNumber,
          publicId: mockPublicId,
          email: newMember.email,
          password: mockPasswordHashed,
          phoneNumber: newMember.phoneNumber,
          isEmployee: false,
        },
      });

      expect(mockPrismaService.member.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          firstName: newMember.firstName,
          lastName: newMember.lastName,
          businessName: undefined,
        },
      });

      const expected: CreateMemberResponseDto = {
        publicId: mockPublicId,
        email: newMember.email,
        phoneNumber: newMember.phoneNumber,
        documentType: newMember.documentType,
        documentNumber: newMember.documentNumber,
        firstName: newMember?.firstName ?? '',
        lastName: newMember?.lastName ?? '',
        businessName: null,
      };

      expect(result).toEqual(expected);
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('userId');
    });

    it('debería lanzar ConflictException si el email ya está registrado', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        {
          email: newMember.email,
          documentType: newMember.documentType + '-otro',
          documentNumber: newMember.documentNumber,
        },
      ]);

      try {
        await service.create(newMember);

        throw new Error('Validó erróneamente email');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect((error as ConflictException).getResponse()).toMatchObject({
          message: ['El email ya está registrado'],
        });
      }

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('debería lanzar ConflictException si el documento ya está registrado', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        {
          email: newMember.email + '-otro',
          documentType: newMember.documentType,
          documentNumber: newMember.documentNumber,
        },
      ]);

      try {
        await service.create(newMember);

        throw new Error('Validó erróneamente tipo y número de documento');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect((error as ConflictException).getResponse()).toMatchObject({
          message: [
            'Ya existe un socio registrado con ese tipo y número de documento',
          ],
        });
      }

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    beforeEach(() => {
      mockPrismaService.$transaction.mockImplementation(
        async (cb: (tx: typeof mockPrismaService) => Promise<unknown>) =>
          cb(mockPrismaService),
      );
    });

    it('debería lanzar NotFoundException si el socio no existe', async () => {
      mockPrismaService.member.findFirst.mockResolvedValue(null);

      await expect(
        service.update('no-existe', { firstName: 'Nuevo' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar ConflictException si el nuevo email pertenece a otro usuario', async () => {
      mockPrismaService.member.findFirst.mockResolvedValue({
        userId: 1,
        businessName: 'Business',
      });
      mockPrismaService.user.findFirst.mockResolvedValue({
        userId: 2,
        email: 'otro@test.com',
      });

      await expect(
        service.update('publicId-1', {
          email: 'otro@test.com',
        }),
      ).rejects.toThrow(new ConflictException(['El email ya está registrado']));

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('debería actualizar correctamente si no hay conflictos', async () => {
      const partialMember = {
        publicId: 'publicId-1',
        email: 'test@test.com',
        phoneNumber: '3411234567',
        firstName: null,
        lastName: null,
        businessName: 'Business',
      };

      mockPrismaService.member.findFirst.mockResolvedValue({
        userId: 1,
        email: partialMember.email,
        businessName: partialMember.businessName,
      });

      mockPrismaService.user.findFirst.mockResolvedValue(null);

      mockPrismaService.member.update.mockResolvedValue({
        userId: 1,
        businessName: 'Business ABC',
      });
      mockPrismaService.user.update.mockResolvedValue({
        userId: 1,
        email: 'testABC@test.com',
      });

      mockPrismaService.user.findUniqueOrThrow.mockResolvedValue({
        publicId: 'publicId-1',
        email: 'testABC@test.com',
        phoneNumber: '3411234567',
        member: {
          userId: 1,
          firstName: null,
          lastName: null,
          businessName: 'Business ABC',
        },
      });

      const result = await service.update('publicId-1', {
        businessName: 'Business ABC',
        email: 'testABC@test.com',
      });

      expect(result).toMatchObject({
        publicId: 'publicId-1',
        email: 'testABC@test.com',
        phoneNumber: '3411234567',
        firstName: null,
        lastName: null,
        businessName: 'Business ABC',
      } satisfies UpdateMemberResponseDto);
    });
  });

  describe('remove', () => {
    it('debería lanzar NotFoundException si el usuario no existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const mockPublicId = 'publicId-inexistente';

      try {
        await service.remove(mockPublicId);
        throw new Error('Fallo al borrar usuario');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).getResponse()).toMatchObject({
          message: `No se encontró el socio con id ${mockPublicId}`,
        });
      }

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { publicId: mockPublicId },
      });

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('debería desactivar al usuario correctamente', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ userId: 1 });
      mockPrismaService.user.update.mockResolvedValue({
        userId: 1,
        isActive: false,
      });

      const result = await service.remove('publicId-1');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { publicId: 'publicId-1' },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { isActive: false },
      });
      expect(result.message).toContain('eliminado correctamente');
    });
  });
});
