import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { nanoid } from 'nanoid';

import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

import { AccountProvisioningService } from '../common/account-provisioning.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeesService } from './employees.service';

jest.mock('nanoid', () => ({
  nanoid: jest.fn(),
}));

describe('EmployeesService', () => {
  let service: EmployeesService;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    employee: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    serviceRequest: {
      groupBy: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockProvisioning = {
    generateTempPassword: jest.fn(),
    hashTempPassword: jest.fn(),
    sendInvitation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AccountProvisioningService, useValue: mockProvisioning },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    const newEmployee: CreateEmployeeDto = {
      email: 'test@test.com',
      phoneNumber: '3411234567',
      documentNumber: '12345678',
      firstName: 'Pepe',
      lastName: 'Pepito',
      employeeType: 'ADMIN',
    };

    it('debería crear el usuario, generar employeeNumber con nanoid y enviar la invitación', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockProvisioning.generateTempPassword.mockReturnValue('tempPass123');
      mockProvisioning.hashTempPassword.mockResolvedValue('hashedPassword');

      (nanoid as jest.Mock)
        .mockReturnValueOnce('public123')
        .mockReturnValueOnce('EMP-generated');

      mockPrismaService.user.create.mockResolvedValue({
        userId: 1,
        publicId: 'public123',
        email: newEmployee.email,
      });

      const result = await service.create(newEmployee);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          publicId: 'public123',
          email: newEmployee.email,
          password: 'hashedPassword',
          phoneNumber: newEmployee.phoneNumber,
          documentType: 'DNI',
          documentNumber: newEmployee.documentNumber,
          isEmployee: true,
          employee: {
            create: {
              firstName: newEmployee.firstName,
              lastName: newEmployee.lastName,
              employeeNumber: 'EMP-generated',
              employeeType: newEmployee.employeeType,
            },
          },
        },
      });

      expect(mockProvisioning.sendInvitation).toHaveBeenCalledWith(
        newEmployee.email,
        'Pepe Pepito',
        'tempPass123',
      );

      expect(result).toEqual({ success: true, publicId: 'public123' });
    });

    it('debería lanzar ConflictException con fieldErrors si el email ya está registrado', async () => {
      mockPrismaService.user.findFirst
        .mockResolvedValueOnce({ userId: 2 }) // email
        .mockResolvedValueOnce(null); // documento

      const error = await service
        .create(newEmployee)
        .catch((err: unknown) => err);

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toMatchObject({
        fieldErrors: {
          email: ['El correo electrónico ya está registrado.'],
        },
      });
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('debería informar email y documento duplicados a la vez', async () => {
      mockPrismaService.user.findFirst
        .mockResolvedValueOnce({ userId: 2 })
        .mockResolvedValueOnce({ userId: 3 });

      const error = await service
        .create(newEmployee)
        .catch((err: unknown) => err);

      expect((error as ConflictException).getResponse()).toMatchObject({
        fieldErrors: {
          email: expect.any(Array) as unknown as string[],
          documentNumber: expect.any(Array) as unknown as string[],
        },
      });
    });

    it('debería traducir un P2002 de carrera a ConflictException', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockProvisioning.generateTempPassword.mockReturnValue('tempPass123');
      mockProvisioning.hashTempPassword.mockResolvedValue('hashedPassword');
      (nanoid as jest.Mock).mockReturnValue('id');

      mockPrismaService.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.create(newEmployee)).rejects.toThrow(
        ConflictException,
      );
      expect(mockProvisioning.sendInvitation).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debería lanzar NotFoundException si el empleado no existe', async () => {
      mockPrismaService.employee.findFirst.mockResolvedValue(null);

      await expect(service.findOne('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería devolver los datos combinados de user y employee', async () => {
      mockPrismaService.employee.findFirst.mockResolvedValue({
        firstName: 'Pepe',
        lastName: 'Pepito',
        employeeNumber: 'EMP-1',
        employeeType: 'ADMIN',
        user: {
          publicId: 'abc123',
          email: 'test@test.com',
          phoneNumber: '3411234567',
          documentType: 'DNI',
          documentNumber: '12345678',
          isActive: true,
          isEmployee: true,
        },
      });

      const result = await service.findOne('abc123');

      expect(result).toEqual({
        publicId: 'abc123',
        firstName: 'Pepe',
        lastName: 'Pepito',
        phoneNumber: '3411234567',
        documentType: 'DNI',
        documentNumber: '12345678',
        email: 'test@test.com',
        employeeNumber: 'EMP-1',
        employeeType: 'ADMIN',
        isEmployee: true,
        isActive: true,
      });
    });
  });

  describe('update', () => {
    beforeEach(() => {
      mockPrismaService.$transaction.mockImplementation(
        async (cb: (tx: typeof mockPrismaService) => Promise<unknown>) =>
          cb(mockPrismaService),
      );
    });

    it('debería lanzar NotFoundException si el empleado no existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update('inexistente', { firstName: 'Nuevo' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException si el empleado está inactivo', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        userId: 1,
        isActive: false,
      });

      await expect(
        service.update('abc123', { firstName: 'Nuevo' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar ConflictException si el email pertenece a otro usuario', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        userId: 1,
        isActive: true,
      });
      mockPrismaService.user.findFirst.mockResolvedValue({
        email: 'otro@test.com',
      });

      await expect(
        service.update('abc123', { email: 'otro@test.com' }),
      ).rejects.toThrow(ConflictException);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('debería repartir los campos entre user y employee y devolver los datos actualizados', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        userId: 1,
        isActive: true,
      });
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.update.mockResolvedValue({});
      mockPrismaService.employee.update.mockResolvedValue({});
      mockPrismaService.employee.findUniqueOrThrow.mockResolvedValue({
        firstName: 'Nuevo',
        lastName: 'Pepito',
        user: {
          publicId: 'abc123',
          email: 'test@test.com',
          phoneNumber: '3410000000',
        },
      });

      const result = await service.update('abc123', {
        firstName: 'Nuevo',
        phoneNumber: '3410000000',
      });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { phoneNumber: '3410000000' },
      });
      expect(mockPrismaService.employee.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { firstName: 'Nuevo' },
      });
      expect(result).toEqual({
        publicId: 'abc123',
        email: 'test@test.com',
        phoneNumber: '3410000000',
        firstName: 'Nuevo',
        lastName: 'Pepito',
      });
    });
  });

  describe('getAllPaginated', () => {
    it('debería mapear empleados con su rol y cantidad de servicios asignados', async () => {
      mockPrismaService.employee.findMany.mockResolvedValue([
        {
          userId: 1,
          firstName: 'Pepe',
          lastName: 'Pepito',
          employeeType: 'ADMIN',
          user: { publicId: 'a1', phoneNumber: '341', isActive: true },
        },
        {
          userId: 2,
          firstName: 'Ana',
          lastName: 'Gómez',
          employeeType: 'OPERATOR',
          user: { publicId: 'b2', phoneNumber: '342', isActive: false },
        },
      ]);
      mockPrismaService.serviceRequest.groupBy.mockResolvedValue([
        { assignedEmployeeId: 1, _count: { assignedEmployeeId: 3 } },
      ]);

      const result = await service.getAllPaginated();

      expect(mockPrismaService.serviceRequest.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { assignedEmployeeId: { in: [1, 2] } },
        }),
      );
      expect(result).toEqual([
        {
          publicId: 'a1',
          name: 'Pepe Pepito',
          role: 'Admin',
          phoneNumber: '341',
          isActive: true,
          assignedServices: 3,
        },
        {
          publicId: 'b2',
          name: 'Ana Gómez',
          role: 'Operador',
          phoneNumber: '342',
          isActive: false,
          assignedServices: 0,
        },
      ]);
    });
  });

  describe('setStatus', () => {
    it('debería lanzar NotFoundException si el usuario no es un empleado', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        userId: 5,
        employee: null,
      });

      await expect(service.setStatus('abc123', false, 99)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('debería impedir que un administrador desactive su propia cuenta', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        userId: 99,
        employee: { userId: 99 },
      });

      await expect(service.setStatus('abc123', false, 99)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('debería desactivar a otro empleado', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        userId: 5,
        employee: { userId: 5 },
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.setStatus('abc123', false, 99);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { publicId: 'abc123' },
        data: { isActive: false },
      });
      expect(result).toEqual({ success: true });
    });
  });
});
