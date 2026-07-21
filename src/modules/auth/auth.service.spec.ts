import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { getUserRole } from '@/common/utils/getUserRole.util';
import { comparePassword } from '@/common/utils/hashPassword.util';
import { PrismaService } from '@/prisma/prisma.service';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

jest.mock('@/common/utils/hashPassword.util');
jest.mock('@/common/utils/getUserRole.util');

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
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
