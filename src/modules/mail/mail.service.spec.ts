import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { MailService } from './mail.service';

const mockSend = jest.fn<
  Promise<{ data: { id: string } | null; error: unknown }>,
  [{ to: string; subject: string; html: string }]
>();

jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => {
      return {
        emails: {
          send: mockSend,
        },
      };
    }),
  };
});

describe('MailService', () => {
  let service: MailService;

  const configValues: Record<string, string> = {
    RESEND_API_KEY: 'api-key',
    FRONTEND_URL: 'https://frontend.com',
  };

  const mockConfigService = {
    get: jest.fn((key: string) => configValues[key]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService.get.mockImplementation(
      (key: string) => configValues[key],
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  describe('sendPasswordReset', () => {
    it('envía el mail con el link de reset y el token', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email' }, error: null });

      const result = await service.sendPasswordReset('user@test.com', 'abc123');
      const sentOptions = mockSend.mock.calls[0][0];

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(sentOptions.to).toBe('user@test.com');
      expect(sentOptions.subject).toBe('Recuperar contraseña');
      expect(sentOptions.html).toContain(
        'https://frontend.com/reset-password?token=abc123',
      );

      expect(result).toEqual({ id: 'email' });
    });
  });

  describe('sendUserInvite', () => {
    it('envía el correo de invitación con nombre y contraseña temporal', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email' }, error: null });

      await service.sendUserInvite('nuevo@test.com', 'Juan', 'tempPass');
      const sentOptions = mockSend.mock.calls[0][0];

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(sentOptions.to).toBe('nuevo@test.com');
      expect(sentOptions.subject).toBe(
        'Fuiste registrado éxitosamente en Guardería Náutica',
      );
      expect(sentOptions.html).toContain('Juan');
      expect(sentOptions.html).toContain('tempPass');
      expect(sentOptions.html).toContain('https://frontend.com/login');
    });
  });

  describe('sendServiceCompleted', () => {
    it('envía el email con el nombre del servicio', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email' }, error: null });

      await service.sendServiceCompleted('user@test.com', 'Cambio de aceite');

      const sentOptions = mockSend.mock.calls[0][0];

      expect(mockSend).toHaveBeenCalledTimes(1);

      expect(sentOptions.to).toBe('user@test.com');
      expect(sentOptions.subject).toBe('Tu servicio fue completado');
      expect(sentOptions.html).toContain('Cambio de aceite');
    });
  });

  describe('manejo de errores', () => {
    it('lanzer un error y loggea cuando Resend devuelve error', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'API key inválida' },
      });

      const logger = (service as unknown as { logger: Logger }).logger;
      const loggerErrorSpy = jest
        .spyOn(logger, 'error')
        .mockImplementation(() => undefined);

      await expect(
        service.sendPasswordReset('user@test.com', 'abc123'),
      ).rejects.toThrow('No se pudo enviar el email');

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('user@test.com'),
      );
    });
  });
});
