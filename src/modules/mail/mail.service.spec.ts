import { BrevoClient, BrevoError } from '@getbrevo/brevo';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { MailService } from './mail.service';

interface SentEmail {
  sender: { name: string; email: string };
  to: { email: string }[];
  subject: string;
  htmlContent: string;
}

const mockSendTransacEmail = jest.fn<Promise<unknown>, [SentEmail]>();

jest.mock('@getbrevo/brevo', () => {
  class BrevoError extends Error {
    statusCode?: number;

    constructor({
      message,
      statusCode,
    }: { message?: string; statusCode?: number } = {}) {
      super(message);
      this.statusCode = statusCode;
    }
  }

  return {
    BrevoClient: jest.fn().mockImplementation(() => ({
      transactionalEmails: { sendTransacEmail: mockSendTransacEmail },
    })),
    BrevoError,
  };
});

describe('MailService', () => {
  let service: MailService;

  const configValues: Record<string, string> = {
    BREVO_API_KEY: 'api-key',
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

  describe('constructor', () => {
    it('inicializa el cliente de Brevo con la API key configurada', () => {
      expect(BrevoClient).toHaveBeenCalledWith(
        expect.objectContaining({ apiKey: 'api-key' }),
      );
    });
  });

  describe('sendPasswordReset', () => {
    it('envía el mail con el link de reset y el token', async () => {
      mockSendTransacEmail.mockResolvedValue({ messageId: 'email' });

      await expect(
        service.sendPasswordReset('user@test.com', 'abc123'),
      ).resolves.toBeUndefined();

      const sentOptions = mockSendTransacEmail.mock.calls[0][0];

      expect(mockSendTransacEmail).toHaveBeenCalledTimes(1);
      expect(sentOptions.sender).toEqual({
        name: 'Guardería Náutica',
        email: 'no-reply@guarderianautica.com',
      });
      expect(sentOptions.to).toEqual([{ email: 'user@test.com' }]);
      expect(sentOptions.subject).toBe('Recuperar contraseña');
      expect(sentOptions.htmlContent).toContain(
        'https://frontend.com/reset-password?token=abc123',
      );
    });
  });

  describe('sendUserInvite', () => {
    it('envía el correo de invitación con nombre y contraseña temporal', async () => {
      mockSendTransacEmail.mockResolvedValue({ messageId: 'email' });

      await service.sendUserInvite('nuevo@test.com', 'Juan', 'tempPass');
      const sentOptions = mockSendTransacEmail.mock.calls[0][0];

      expect(mockSendTransacEmail).toHaveBeenCalledTimes(1);
      expect(sentOptions.to).toEqual([{ email: 'nuevo@test.com' }]);
      expect(sentOptions.subject).toBe(
        'Fuiste registrado exitosamente en Guardería Náutica',
      );
      expect(sentOptions.htmlContent).toContain('Juan');
      expect(sentOptions.htmlContent).toContain('tempPass');
      expect(sentOptions.htmlContent).toContain('https://frontend.com/login');
    });
  });

  describe('sendServiceCompleted', () => {
    it('envía el email con el nombre del servicio', async () => {
      mockSendTransacEmail.mockResolvedValue({ messageId: 'email' });

      await service.sendServiceCompleted('user@test.com', 'Cambio de aceite');

      const sentOptions = mockSendTransacEmail.mock.calls[0][0];

      expect(mockSendTransacEmail).toHaveBeenCalledTimes(1);
      expect(sentOptions.to).toEqual([{ email: 'user@test.com' }]);
      expect(sentOptions.subject).toBe('Tu servicio fue completado');
      expect(sentOptions.htmlContent).toContain('Cambio de aceite');
    });
  });

  describe('manejo de errores', () => {
    let loggerErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      const logger = (service as unknown as { logger: Logger }).logger;
      loggerErrorSpy = jest
        .spyOn(logger, 'error')
        .mockImplementation(() => undefined);
    });

    it('lanza un error y loggea con el status cuando Brevo devuelve un BrevoError', async () => {
      mockSendTransacEmail.mockRejectedValue(
        new BrevoError({ message: 'API key inválida', statusCode: 401 }),
      );

      await expect(
        service.sendPasswordReset('user@test.com', 'abc123'),
      ).rejects.toThrow('No se pudo enviar el email');

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('401'),
      );
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('user@test.com'),
      );
    });

    it('lanza un error y loggea cuando falla por un error que no es de Brevo', async () => {
      mockSendTransacEmail.mockRejectedValue(new Error('network down'));

      await expect(
        service.sendPasswordReset('user@test.com', 'abc123'),
      ).rejects.toThrow('No se pudo enviar el email');

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('user@test.com'),
      );
    });
  });
});
