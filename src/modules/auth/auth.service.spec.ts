import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { getUserRole } from '@/common/utils/getUserRole.util';
import {
  comparePassword,
  hashPassword,
} from '@/common/utils/hashPassword.util';
import { PrismaService } from '@/prisma/prisma.service';

import { MailService } from '../mail/mail.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

interface PasswordResetTokenRecord {
  passwordResetTokenId: number;
  userId: number;
  tokenHash: string;
  used: boolean;
  expiresAt: Date;
}

type CreateTokenArgs = [
  {
    data: {
      userId: string;
      tokenHash: string;
      expiresAt: Date;
    };
  },
];

jest.mock('@/common/utils/hashPassword.util');
jest.mock('@/common/utils/getUserRole.util');

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn<Promise<PasswordResetTokenRecord>, CreateTokenArgs>(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockMailService = {
    sendPasswordReset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPasswordReset', () => {
    it('debería retornar el mensaje sin enviar mail si el usuario no existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.requestPasswordReset('test@test.com');

      expect(result).toEqual({
        message: 'Se ha enviado un email a su correo',
      });

      expect(
        mockPrismaService.passwordResetToken.create,
      ).not.toHaveBeenCalled();
    });

    it('debería retornar el mensaje sin enviar mail si el usuario está inactivo', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        userId: 1,
        email: 'test@test.com',
        isActive: false,
      });

      const result = await service.requestPasswordReset('test@test.com');

      expect(result).toEqual({
        message: 'Se ha enviado un email a su correo',
      });

      expect(
        mockPrismaService.passwordResetToken.create,
      ).not.toHaveBeenCalled();
      expect(mockMailService.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('debería crear el token hash y llamar al MailService si el usuario existe y está activo', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        userId: 1,
        email: 'test@test.com',
        isActive: true,
      });

      const result = await service.requestPasswordReset('test@test.com');
      const createArgs =
        mockPrismaService.passwordResetToken.create.mock.calls[0][0];

      expect(createArgs.data.tokenHash).toHaveLength(64);

      expect(result).toEqual({
        message: 'Se ha enviado un email a su correo',
      });

      expect(mockPrismaService.passwordResetToken.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          tokenHash: expect.any(String) as unknown as string,
          expiresAt: expect.any(Date) as unknown as Date,
        },
      });

      expect(mockMailService.sendPasswordReset).toHaveBeenCalledWith(
        'test@test.com',
        expect.any(String) as unknown as string,
      );
    });

    it('la expiración del token debe ser aproximadamente 1 hora', async () => {
      const now = new Date(2020, 7, 9);
      jest.useFakeTimers().setSystemTime(now);

      mockPrismaService.user.findUnique.mockResolvedValue({
        userId: 1,
        email: 'test@test.com',
        isActive: true,
      });

      await service.requestPasswordReset('test@test.com');

      const createCallArgs =
        mockPrismaService.passwordResetToken.create.mock.calls[0][0];
      const expiresAt = new Date(now.getTime() + 1000 * 60 * 60);

      expect(createCallArgs.data.userId).toBe(1);
      expect(createCallArgs.data.tokenHash).toEqual(expect.any(String));
      expect(createCallArgs.data.expiresAt).toEqual(expiresAt);

      jest.useRealTimers();
    });
  });

  describe('resetPassword', () => {
    it('debería lanzar UnauthorizedException si el token es inválido o expiró', async () => {
      mockPrismaService.passwordResetToken.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword('rawToken', 'newPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debería actualizar la contraseña y marcar el token como usado mediante una transacción', async () => {
      mockPrismaService.passwordResetToken.findFirst.mockResolvedValue({
        passwordResetTokenId: 'token-id',
        userId: 1,
      });

      (hashPassword as jest.Mock).mockResolvedValue('hasedPassword');

      mockPrismaService.$transaction.mockResolvedValue([{}, {}]);

      const result = await service.resetPassword('rawToken', 'newPassword');

      expect(result).toEqual({ message: 'Contraseña actualizada' });
      expect(hashPassword).toHaveBeenCalledWith('newPassword');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('validateCredentials', () => {
    const dto: LoginDto = {
      email: 'test@test.com',
      password: 'password',
    };

    const hashedPassword = 'hashed';

    it('debería lanzar UnauthorizedException si el usuario no existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.validateCredentials(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debería lanzar UnauthorizedException si el usuario está inactivo', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        publicId: 'id',
        password: 'hashed',
        isActive: false,
        employee: null,
      });

      await expect(service.validateCredentials(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debería lanzar UnauthorizedException si la password es incorrecta', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        publicId: 'id',
        password: 'hash',
        isActive: true,
        employee: null,
      });

      (comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(service.validateCredentials(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debería devolver el id y el role del usuario', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        publicId: 'id',
        password: hashedPassword,
        isActive: true,
        employee: null,
      });

      (comparePassword as jest.Mock).mockResolvedValue(true);
      (getUserRole as jest.Mock).mockReturnValue('member');

      const result = await service.validateCredentials(dto);

      expect(result).toEqual({
        id: 'id',
        role: 'member',
      });
    });
  });

  describe('generateToken', () => {
    it('debería firmar y devolver un token JWT', () => {
      mockJwtService.sign.mockReturnValue('jwt-token');

      const user = { id: 'user-id', role: 'admin' };
      const token = service.generateToken(user);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        role: user.role,
      });
      expect(token).toBe('jwt-token');
    });
  });

  describe('validateCredentials', () => {
    const dto: LoginDto = {
      email: 'test@test.com',
      password: 'password',
    };

    const hashedPassword = 'hashed';

    it('debería lanzar UnauthorizedException si el usuario no existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.validateCredentials(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debería lanzar UnauthorizedException si el usuario está inactivo', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        publicId: 'id',
        password: 'hashed',
        isActive: false,
        employee: null,
      });

      await expect(service.validateCredentials(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debería lanzar UnauthorizedException si la password es incorrecta', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        publicId: 'id',
        password: 'hash',
        isActive: false,
        employee: null,
      });

      (comparePassword as jest.Mock).mockResolvedValue(hashedPassword);

      await expect(service.validateCredentials(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debería devolver el id y el role del usuario', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        publicId: 'id',
        password: hashedPassword,
        isActive: true,
        employee: null,
      });

      (comparePassword as jest.Mock).mockResolvedValue(hashedPassword);
      (getUserRole as jest.Mock).mockReturnValue('member');

      const result = await service.validateCredentials(dto);

      expect(result).toEqual({
        id: 'id',
        role: 'member',
      });
    });
  });
});
