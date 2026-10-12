import { BrevoClient, BrevoError } from '@getbrevo/brevo';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { escapeHtml } from './escape-html';

export interface ContactMessage {
  fullname: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

@Injectable()
export class MailService {
  private readonly brevo: BrevoClient;
  private readonly logger = new Logger(MailService.name);
  private readonly frontendUrl: string;
  private readonly sender: { name: string; email: string };

  constructor(private readonly configService: ConfigService) {
    this.brevo = new BrevoClient({
      apiKey: this.configService.get<string>('BREVO_API_KEY')!,
      timeoutInSeconds: 15,
      maxRetries: 2,
    });
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL')!;
    this.sender = {
      name: 'Guardería Náutica',
      email:
        this.configService.get<string>('MAIL_FROM_EMAIL') ??
        'no-reply@guarderianautica.com',
    };
  }

  private async send(
    to: string,
    subject: string,
    html: string,
    replyTo?: { email: string; name?: string },
  ): Promise<void> {
    try {
      await this.brevo.transactionalEmails.sendTransacEmail({
        sender: this.sender,
        to: [{ email: to }],
        subject,
        htmlContent: html,
        replyTo,
      });
    } catch (error) {
      if (error instanceof BrevoError) {
        this.logger.error(
          `Brevo ${error.statusCode} enviando a ${to}: ${error.message}`,
        );
      } else {
        this.logger.error(`Error enviando mail a ${to}: ${String(error)}`);
      }
      throw new Error('No se pudo enviar el email');
    }
  }

  async sendPasswordReset(to: string, resetToken: string): Promise<void> {
    const link = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    await this.send(
      to,
      'Recuperar contraseña',
      `<p>Hacé click <a href="${link}">acá</a> para restablecer tu contraseña. El link expira en 1 hora.</p>`,
    );
  }

  async sendUserInvite(
    to: string,
    name: string,
    tempPassword: string,
  ): Promise<void> {
    const link = `${this.frontendUrl}/login`;

    await this.send(
      to,
      'Fuiste registrado exitosamente en Guardería Náutica',
      `<p>Hola ${name}, un administrador te registró en la plataforma.</p>
    <p>Email: ${to}<br/>Contraseña temporal: <b>${tempPassword}</b></p>
    <p>Ingresá <a href="${link}">acá</a> y cambiala apenas inicies sesión.</p>`,
    );
  }

  async sendServiceCompleted(to: string, serviceName: string): Promise<void> {
    await this.send(
      to,
      'Tu servicio fue completado',
      `<p>El servicio "${serviceName}" que solicitaste fue completado con éxito.</p>`,
    );
  }

  async sendContactMessage(to: string, contact: ContactMessage): Promise<void> {
    const { fullname, email, phone, subject, message } = contact;

    await this.send(
      to,
      `Nueva consulta: ${subject}`,
      `<h2>Nueva consulta desde la web</h2>
    <p><strong>Nombre y apellido:</strong> ${escapeHtml(fullname)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Teléfono:</strong> ${escapeHtml(phone || 'No informado')}</p>
    <p><strong>Asunto:</strong> ${escapeHtml(subject)}</p>
    <hr />
    <h3>Mensaje:</h3>
    <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>`,
      { email, name: fullname },
    );
  }
}
