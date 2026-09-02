import { Test, TestingModule } from '@nestjs/testing';
import type { CookieOptions, Response } from 'express';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    validateCredentials: jest.fn(),
    generateToken: jest.fn(),
  };

  const mockCookie = jest.fn<
    void,
    [name: string, value: string, options?: CookieOptions]
  >();

  const mockResponse = {
    cookie: mockCookie,
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
      remember: true,
    };

    it('debería validar credenciales, generar token y setear la cookie persistente para recordar la cuenta', async () => {
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
      expect(mockAuthService.generateToken).toHaveBeenCalledWith(user.id);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'access_token',
        'token',
        expect.objectContaining({
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 1000 * 60 * 60 * 24, // 1 día
          path: '/',
        }),
      );

      expect(result).toEqual({ user });
    });

    it('debería crear una cookie de sesión si debe recordar la cuenta', async () => {
      const loginDtoWithoutRemember: LoginDto = {
        email: 'test@test.com',
        password: 'password',
        remember: false,
      };

      const user = { id: 'id', role: 'member' };

      mockAuthService.validateCredentials.mockResolvedValue(user);
      mockAuthService.generateToken.mockReturnValue('token');

      await controller.login(
        loginDtoWithoutRemember,
        mockResponse as unknown as Response,
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'access_token',
        'token',
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        },
      );
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

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('access_token', {
        path: '/',
      });
      expect(result).toEqual({ message: 'Sesión cerrada' });
    });
  });
});
