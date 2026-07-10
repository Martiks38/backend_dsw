jest.mock('bcrypt');
jest.mock('nanoid', () => ({
  nanoid: jest.fn(),
}));

import * as bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { Test, TestingModule } from '@nestjs/testing';
import { MembersService } from './members.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RawMemberWithUser } from './member.types';
import { CreateMemberDto, CreateMemberResponseDto } from './dto';

describe('MembersService', () => {
  let service: MembersService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    member: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
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
        documentType: 'DNI',
        documentNumber: '12345678',
        firstName: 'Juan',
        lastName: 'Pérez',
        businessName: null,
        user: {
          publicId: 'abc123',
          email: 'juan@test.com',
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
      email: 'juan@test.com',
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
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.member.findFirst.mockRejectedValue(null);

      const mockPasswordHashed = 'hashedPassword';
      const mockPublicId = 'publicId123';

      (bcrypt.hash as jest.Mock).mockResolvedValue(mockPasswordHashed);
      (nanoid as jest.Mock).mockReturnValue(mockPublicId);

      mockPrismaService.user.create.mockResolvedValue({
        userId: 1,
        publicId: mockPublicId,
        password: mockPasswordHashed,
        email: newMember.email,
        phoneNumber: newMember.phoneNumber,
        isActive: true,
        isEmployee: false,
      });

      mockPrismaService.member.create.mockResolvedValue({
        userId: 1,
        documentType: 'DNI',
        documentNumber: '12345678',
        firstName: 'Juan',
        lastName: 'Pérez',
        businessName: null,
      });

      const result = await service.create(newMember);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: newMember.email },
      });

      expect(mockPrismaService.member.findUnique).toHaveBeenCalledWith({
        where: {
          documentType_documentNumber: {
            documentType: newMember.documentType,
            documentNumber: newMember.documentNumber,
          },
        },
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(newMember.password, 10);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
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
          documentType: 'DNI',
          documentNumber: '12345678',
          firstName: 'Pepe',
          lastName: 'Pepito',
          businessName: undefined,
        },
      });

      const expected: CreateMemberResponseDto = {
        documentType: 'DNI',
        documentNumber: '12345678',
        firstName: 'Juan',
        lastName: 'Pérez',
        businessName: null,
        publicId: 'publicId123',
        email: 'juan@test.com',
        phoneNumber: '3411234567',
      };

      expect(result).toEqual(expected);
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('userId');
    });

    it('debería lanzar ConflictException si el email ya está registrado', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ userId: 5 });
      mockPrismaService.member.findUnique.mockResolvedValue(null);

      await expect(service.create(newMember)).rejects.toThrow(
        ConflictException,
      );

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('debería lanzar ConflictException si el documento ya está registrado', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(5);
      mockPrismaService.member.findUnique.mockResolvedValue(null);

      await expect(service.create(newMember)).rejects.toThrow(
        ConflictException,
      );

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('debería lanzar NotFoundException si el socio no existe', async () => {
      mockPrismaService.member.findFirst.mockResolvedValue(null);

      await expect(
        service.update('no-existe', { firstName: 'Nuevo' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar ConflictException si el nuevo email pertenece a otro usuario', async () => {
      mockPrismaService.member.findFirst.mockResolvedValue({
        userId: 1,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        userId: 2,
        email: 'otro@test.com',
      });

      await expect(
        service.update('publicId-1', { email: 'otro@test.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('debería actualizar correctamente si no hay conflictos', async () => {
      mockPrismaService.member.findFirst.mockResolvedValue({
        userId: 1,
      });
      mockPrismaService.$transaction.mockImplementation(
        async (cb: (tx: typeof mockPrismaService) => Promise<unknown>) =>
          cb(mockPrismaService),
      );
      mockPrismaService.member.update.mockResolvedValue({
        userId: 1,
        firstName: 'Actualizado',
      });
      mockPrismaService.user.findUniqueOrThrow.mockResolvedValue({
        publicId: 'publicId-1',
        email: 'juan@test.com',
        phoneNumber: '3411234567',
        isActive: true,
      });

      const result = await service.update('publicId-1', {
        firstName: 'Actualizado',
      });

      expect(result.firstName).toBe('Actualizado');
    });
  });

  describe('remove', () => {
    it('debería lanzar NotFoundException si el usuario no existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('publicId-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería desactivar al usuario correctamente', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ userId: 1 });
      mockPrismaService.user.update.mockResolvedValue({
        userId: 1,
        isActive: false,
      });

      const result = await service.remove('publicId-1');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { isActive: false },
      });

      expect(result.message).toContain('eliminado correctamente');
    });
  });
});
