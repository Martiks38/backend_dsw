import { BadRequestException, UnauthorizedException } from '@nestjs/common';
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

interface CreateTokenData {
  userId: number;
  tokenHash: string;
  expiresAt: Date;
}

interface CreateTokenArgs {
  data: CreateTokenData;
}

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
      create: jest.fn<
        Promise<{ passwordResetTokenId: number }>,
        [CreateTokenArgs]
      >(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
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
    jest.useRealTimers();
  });

  describe('forgotPassword', () => {
    it('no debería crear token ni enviar mail si el usuario no existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await service.forgotPassword('test@test.com');

      expect(
        mockPrismaService.passwordResetToken.create,
      ).not.toHaveBeenCalled();
      expect(mockMailService.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('no debería crear token ni enviar mail si el usuario está inactivo', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        userId: 1,
        email: 'test@test.com',
        isActive: false,
      });

      await service.forgotPassword('test@test.com');

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

      await service.forgotPassword('test@test.com');

      const createArgs =
        mockPrismaService.passwordResetToken.create.mock.calls[0][0];
      expect(createArgs.data.tokenHash).toHaveLength(64); // sha256 hex

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

      await service.forgotPassword('test@test.com');

      const createCallArgs =
        mockPrismaService.passwordResetToken.create.mock.calls[0][0];
      const expiresAt = new Date(now.getTime() + 1000 * 60 * 60);

      expect(createCallArgs.data.userId).toBe(1);
      expect(createCallArgs.data.tokenHash).toEqual(expect.any(String));
      expect(createCallArgs.data.expiresAt).toEqual(expiresAt);
    });
  });

  describe('resetPassword', () => {
    it('debería lanzar BadRequestException si el token no existe', async () => {
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          token: 'rawToken',
          newPassword: 'newPassword123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar BadRequestException si el token ya fue usado', async () => {
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue({
        passwordResetTokenId: 1,
        userId: 1,
        used: true,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });

      await expect(
        service.resetPassword({
          token: 'rawToken',
          newPassword: 'newPassword123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar BadRequestException si el token expiró', async () => {
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue({
        passwordResetTokenId: 1,
        userId: 1,
        used: false,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.resetPassword({
          token: 'rawToken',
          newPassword: 'newPassword123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería actualizar la contraseña y marcar el token como usado mediante una transacción', async () => {
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue({
        passwordResetTokenId: 1,
        userId: 1,
        used: false,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });

      (hashPassword as jest.Mock).mockResolvedValue('hashedPassword');
      mockPrismaService.$transaction.mockResolvedValue([{}, {}]);

      await service.resetPassword({
        token: 'rawToken',
        newPassword: 'newPassword123',
      });

      expect(hashPassword).toHaveBeenCalledWith('newPassword123');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('validateCredentials', () => {
    const dto: LoginDto = {
      email: 'test@test.com',
      password: 'password',
      remember: true,
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

      expect(result).toEqual({ id: 'id', role: 'member' });
    });
  });

  describe('generateToken', () => {
    it('debería firmar y devolver un token JWT', async () => {
      mockJwtService.signAsync.mockResolvedValue('jwt-token');

      const token = await service.generateToken('user-id');

      expect(mockJwtService.signAsync).toHaveBeenCalledWith({ sub: 'user-id' });
      expect(token).toBe('jwt-token');
    });
  });
});
