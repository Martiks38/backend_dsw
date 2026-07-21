import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    validateCredentials: jest.fn(),
    generateToken: jest.fn(),
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@test.com',
      password: 'password',
    };

    it('debería validar credenciales, generar token y setear la cookie', async () => {
      const user = { id: 'id', role: 'member' };
      mockAuthService.validateCredentials.mockResolvedValue(user);
      mockAuthService.generateToken.mockReturnValue('token');

      const result = await controller.login(
        loginDto,
        mockResponse as unknown as Response,
      );

      expect(mockAuthService.validateCredentials).toHaveBeenCalledWith(
        loginDto,
      );
      expect(mockAuthService.generateToken).toHaveBeenCalledWith(user);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'access_token',
        'token',
        expect.objectContaining({
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 24,
        }),
      );
      expect(result).toEqual({ message: 'Login exitoso' });
    });

    it('debería propagar el error si las credenciales son inválidas', async () => {
      mockAuthService.validateCredentials.mockRejectedValue(
        new Error('Credenciales inválidas'),
      );

      await expect(
        controller.login(loginDto, mockResponse as unknown as Response),
      ).rejects.toThrow('Credenciales inválidas');

      expect(mockAuthService.generateToken).not.toHaveBeenCalled();
      expect(mockResponse.cookie).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('debería limpiar la cookie access_token y devolver el mensaje', () => {
      const result = controller.logout(mockResponse as unknown as Response);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('access_token');
      expect(result).toEqual({ message: 'Sesión cerrada' });
    });
  });
});
