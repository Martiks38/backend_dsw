import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { nanoid } from 'nanoid';

import { PrismaService } from '@/prisma/prisma.service';

import { AppRole } from '../auth/role.enum';
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
      create: jest.fn(),
    },
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
    jest.clearAllMocks();
  });

  describe('create', () => {
    const newEmployee: CreateEmployeeDto = {
      email: 'test@test.com',
      phoneNumber: '3411234567',
      documentNumber: '12345678',
      firstName: 'Pepe',
      lastName: 'Pepito',
      employeeType: AppRole.ADMIN,
    };

    it('debería crear el usuario, generar employeeNumber con nanoid y enviar la invitación', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null); // sin duplicados
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

    it('debería lanzar ConflictException si el email ya está registrado', async () => {
      mockPrismaService.user.findFirst
        .mockResolvedValueOnce({ userId: 2 }) // email
        .mockResolvedValueOnce(null); // documento

      await expect(service.create(newEmployee)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });
});
