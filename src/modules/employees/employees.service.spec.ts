import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { nanoid } from 'nanoid';

import { hashPassword } from '@/common/utils/hashPassword.util';
import { EmployeeType } from '@/generated/prisma/enums';
import { PrismaService } from '@/prisma/prisma.service';

import {
  CreateEmployeeDto,
  CreateEmployeeResponseDto,
  UpdateEmployeeResponseDto,
} from './dto';
import { EmployeesService } from './employees.service';
import { RawEmployeeWithUser } from './employees.types';

jest.mock('@/common/utils/hashPassword.util');
jest.mock('nanoid', () => ({
  nanoid: jest.fn(),
}));

describe('EmployeesService', () => {
  let service: EmployeesService;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    employee: {
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('debería lanzar NotFoundException si el employee no existe', async () => {
      mockPrismaService.employee.findFirst(null);

      await expect(service.findOne('publicId-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería devolver el empleado combinando datos de user y employee', async () => {
      const mockRawEmployee: RawEmployeeWithUser = {
        firstName: 'Pepe',
        lastName: 'Pepito',
        employeeNumber: '12345',
        employeeType: EmployeeType.ADMIN,
        user: {
          publicId: 'abc123',
          email: 'test@test.com',
          phoneNumber: '3411234567',
          documentType: 'DNI',
          documentNumber: '12345678',
          isActive: true,
          isEmployee: true,
        },
      };

      mockPrismaService.employee.findFirst.mockResolvedValue(mockRawEmployee);

      const result = await service.findOne('abc123');

      const { user, ...rest } = mockRawEmployee;
      const expectedValue = {
        ...rest,
        ...user,
      };

      expect(result).toEqual(expectedValue);
    });
  });

  describe('create', () => {
    const newEmployee: CreateEmployeeDto = {
      email: 'test@test.com',
      password: '123',
      phoneNumber: 'phoneNumber',
      firstName: 'Pepe',
      lastName: 'Pepito',
      employeeType: EmployeeType.ADMIN,
      documentType: 'DNI',
      documentNumber: '12345678',
    };

    beforeEach(() => {
      mockPrismaService.$transaction.mockImplementation(
        async (
          cb: (tx: typeof mockPrismaService) => Promise<CreateEmployeeDto>,
        ) => cb(mockPrismaService),
      );
    });

    it('debería crear el user y el employee correctamente', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const mockPasswordHashed = 'hashedPassword';
      const mockPublicId = 'public123';
      const mockEmployeeNumber = 'employee1';

      (hashPassword as jest.Mock).mockResolvedValue(mockPasswordHashed);
      (nanoid as jest.Mock)
        .mockReturnValueOnce(mockPublicId)
        .mockReturnValueOnce(mockEmployeeNumber);

      mockPrismaService.user.create.mockResolvedValue({
        userId: 1,
        publicId: mockPublicId,
        password: mockPasswordHashed,
        documentType: newEmployee.documentType,
        documentNumber: newEmployee.documentNumber,
        email: newEmployee.email,
        phoneNumber: newEmployee.phoneNumber,
        isEmployee: true,
        isActive: true,
      });

      mockPrismaService.employee.create.mockResolvedValue({
        userId: 1,
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        employeeNumber: mockEmployeeNumber,
        employeeType: EmployeeType.ADMIN,
      });

      const result = await service.create(newEmployee);

      expect(hashPassword).toHaveBeenCalledWith(newEmployee.password);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          publicId: mockPublicId,
          documentType: newEmployee.documentType,
          documentNumber: newEmployee.documentNumber,
          email: newEmployee.email,
          password: mockPasswordHashed,
          phoneNumber: newEmployee.phoneNumber,
          isEmployee: true,
        },
      });

      expect(mockPrismaService.employee.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          firstName: newEmployee.firstName,
          lastName: newEmployee.lastName,
          employeeType: newEmployee.employeeType,
          employeeNumber: mockEmployeeNumber,
        },
      });

      const expectedResult: CreateEmployeeResponseDto = {
        publicId: mockPublicId,
        email: newEmployee.email,
        phoneNumber: newEmployee.phoneNumber,
        documentType: newEmployee.documentType,
        documentNumber: newEmployee.documentNumber,
        employeeType: newEmployee.employeeType,
        employeeNumber: mockEmployeeNumber,
      };

      expect(result).toMatchObject(expectedResult);
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('userId');
    });

    it('debería lanzar ConflictExpection si el email ya está registrado', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        {
          email: newEmployee.email,
          documentType: 'DNI',
          documentNumber: '11111111',
        },
      ]);

      const error = await service
        .create(newEmployee)
        .catch((err: unknown) => err);

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toMatchObject({
        message: ['El email ya está registrado'],
      });

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

    it('debería lanzar NotFoundException si no encuentra al empleado', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const publicId = 'inexistente';

      const error = await service
        .update(publicId, {
          firstName: 'Actualizado',
        })
        .catch((err: unknown) => err);

      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).getResponse()).toMatchObject({
        message: `No se encontró el empleado con id ${publicId}`,
      });

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('debería lanzar ConflictException si el nuevo email pertenece a otro usuario', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        userId: 1,
        publicId: 'abc123',
        email: 'test@test.com',
        isActive: true,
      });

      mockPrismaService.user.findFirst.mockResolvedValue({
        userId: 2,
        email: 'otro@test.com',
      });

      const error = await service
        .update('abc123', { email: 'otro@test.com' })
        .catch((err: unknown) => err);

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toMatchObject({
        message: 'El email ya está registrado',
      });

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('debería actualizar correctamente el usuario', async () => {
      const partialEmployee = {
        publicId: 'abc123',
        email: 'test@test.com',
        phoneNumber: '3411234567',
        firstName: 'Pepe',
        lastName: 'Pepito',
        isActive: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        userId: 1,
        isActive: true,
      });
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      mockPrismaService.user.update.mockResolvedValue({
        userId: 1,
        email: 'otro@test.com',
      });
      mockPrismaService.employee.update.mockResolvedValue({
        userId: 1,
        firstName: 'Pepe-Actualizado',
      });
      mockPrismaService.employee.findUniqueOrThrow.mockResolvedValue({
        firstName: 'Pepe-Actualizado',
        lastName: partialEmployee.lastName,
        user: {
          publicId: partialEmployee.publicId,
          email: 'otro@test.com',
          phoneNumber: partialEmployee.phoneNumber,
        },
      });

      const result = await service.update('abc123', {
        firstName: 'Pepe-Actualizado',
        email: 'otro@test.com',
      });

      expect(result).toMatchObject({
        firstName: 'Pepe-Actualizado',
        lastName: partialEmployee.lastName,
        publicId: partialEmployee.publicId,
        email: 'otro@test.com',
        phoneNumber: partialEmployee.phoneNumber,
      } satisfies UpdateEmployeeResponseDto);
    });
  });

  describe('remove', () => {
    it('debería lanzar NotFoundException si no encuentra al empleado', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const publicId = 'abc123';
      const err = await service.remove(publicId).catch((err: unknown) => err);

      expect(err).toBeInstanceOf(NotFoundException);
      expect((err as NotFoundException).getResponse()).toMatchObject({
        message: `No se encontro el empleado con id ${publicId}`,
      });

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('debería deshabilidar al empleado correctamente', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        userId: 1,
        isActive: true,
      });
      mockPrismaService.user.update.mockResolvedValue({
        userId: 1,
        isActive: false,
      });

      const publicId = 'abc123';
      const response = await service.remove(publicId);

      expect(response).toMatchObject({
        success: true,
        message: `Empleado con id ${publicId} fue eliminado exitosamente`,
      });
    });
  });
});
