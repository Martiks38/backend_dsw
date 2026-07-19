import { Test, TestingModule } from '@nestjs/testing';

import { MembersController } from './members.controller';
import { MembersService } from './members.service';

jest.mock('nanoid', () => ({
  nanoid: jest.fn(),
}));

describe('MembersController', () => {
  let controller: MembersController;

  const mockMembersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembersController],
      providers: [{ provide: MembersService, useValue: mockMembersService }],
    }).compile();

    controller = module.get<MembersController>(MembersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debería llamar a membersService.create con el DTO recibido', async () => {
      const dto = {
        email: 'juan@test.com',
        password: '123456',
        documentType: 'DNI',
        documentNumber: '12345678',
        firstName: 'Juan',
        lastName: 'Pérez',
        phoneNumber: '3411234567',
      };

      const expectedResult = { userId: 1, publicId: 'abc123', ...dto };
      mockMembersService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(dto);

      expect(mockMembersService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('debería llamar a membersService.findOne con el publicId recibido', async () => {
      const expectedResult = { publicId: 'abc123', firstName: 'Juan' };
      mockMembersService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne('abc123');

      expect(mockMembersService.findOne).toHaveBeenCalledWith('abc123');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('debería llamar a membersService.update con publicId y dto', async () => {
      const dto = { firstName: 'Actualizado' };
      const expectedResult = { publicId: 'abc123', firstName: 'Actualizado' };
      mockMembersService.update.mockResolvedValue(expectedResult);

      const result = await controller.update('abc123', dto);

      expect(mockMembersService.update).toHaveBeenCalledWith('abc123', dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('debería llamar a membersService.remove con el publicId recibido', async () => {
      const expectedResult = { message: 'Socio eliminado correctamente' };
      mockMembersService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove('abc123');

      expect(mockMembersService.remove).toHaveBeenCalledWith('abc123');
      expect(result).toEqual(expectedResult);
    });
  });
});
