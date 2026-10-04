import { Test, TestingModule } from '@nestjs/testing';

import { EmployeeType } from '@/generated/prisma/enums';

import { type AuthenticatedUser } from '../auth/auth.interface';
import { AppRole } from '../auth/role.enum';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

jest.mock('nanoid', () => ({
  nanoid: jest.fn(),
}));

describe('EmployeesController', () => {
  let controller: EmployeesController;

  const mockEmployeesService = {
    create: jest.fn(),
    findOne: jest.fn(),
    getAllPaginated: jest.fn(),
    update: jest.fn(),
    setStatus: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [
        { provide: EmployeesService, useValue: mockEmployeesService },
      ],
    }).compile();

    controller = module.get<EmployeesController>(EmployeesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debería llamar a employeesService.create con el DTO recibido', async () => {
      const dto: CreateEmployeeDto = {
        firstName: 'Pepe',
        lastName: 'Pepito',
        email: 'test@test.com',
        phoneNumber: '3411234567',
        documentNumber: '12345678',
        employeeType: EmployeeType.ADMIN,
      };

      const expectedResult = { userId: 1, publicId: 'abc123', ...dto };

      mockEmployeesService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(dto);

      expect(mockEmployeesService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('debería llamar a employeesService.findOne con el publicId recibido', async () => {
      const expectedResult = {
        publicId: 'abc123',
        firstName: 'Pepe',
        lastName: 'Pepito',
        phoneNumber: '3411234567',
        email: 'test@test.com',
        employeeNumber: '1234567890',
        employeeType: EmployeeType.ADMIN,
        isEmployee: true,
        isActive: true,
        documentType: 'DNI',
        documentNumber: '12345678',
      };
      mockEmployeesService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne('abc123');

      expect(mockEmployeesService.findOne).toHaveBeenCalledWith('abc123');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getAll', () => {
    it('debería llamar a employeesService.getAllPaginated sin argumentos', async () => {
      const expectedResult = [
        {
          publicId: 'abc123',
          firstName: 'Pepe',
          lastName: 'Pepito',
          employeeType: EmployeeType.ADMIN,
          isActive: true,
          assignedServices: 3,
        },
      ];

      mockEmployeesService.getAllPaginated.mockResolvedValue(expectedResult);

      const result = await controller.getAll();

      expect(mockEmployeesService.getAllPaginated).toHaveBeenCalledWith();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('debería llamar a employeesService.update con publicId y dto', async () => {
      const dto: UpdateEmployeeDto = {
        firstName: 'Actualizado',
      };

      const mockEmployee = {
        publicId: 'abc123',
        firstName: 'Pepe',
        lastName: 'Pepito',
        phoneNumber: '3411234567',
        email: 'test@test.com',
        employeeNumber: '1234567890',
        employeeType: EmployeeType.ADMIN,
        isEmployee: true,
        isActive: true,
        documentType: '',
        documentNumber: '',
      };

      const expectedResult = {
        ...mockEmployee,
      };

      if (typeof dto.firstName === 'string')
        expectedResult.firstName = dto.firstName;

      mockEmployeesService.update.mockResolvedValue(expectedResult);

      const result = await controller.update('abc123', dto);

      expect(mockEmployeesService.update).toHaveBeenCalledWith('abc123', dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('setStatus', () => {
    it('debería llamar a employeesService.setStatus con publicId, isActive y el internalId del usuario actual', async () => {
      const mockUser: AuthenticatedUser = {
        id: 'admin-public-id',
        internalId: 99,
        role: AppRole.ADMIN,
        name: 'Admin Test',
      };

      const expectedResult = { success: true };

      mockEmployeesService.setStatus.mockResolvedValue(expectedResult);

      const result = await controller.setStatus(
        'abc123',
        { isActive: false },
        mockUser,
      );

      expect(mockEmployeesService.setStatus).toHaveBeenCalledWith(
        'abc123',
        false,
        99,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('debería llamar a employeesService.remove con el publicId recibido', async () => {
      const expectedResult = { message: 'Empleado eliminado correctamente' };
      mockEmployeesService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove('abc123');

      expect(mockEmployeesService.remove).toHaveBeenCalledWith('abc123');
      expect(result).toEqual(expectedResult);
    });
  });
});
