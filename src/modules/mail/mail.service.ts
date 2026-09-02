import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL')!;
  }

  private async send(to: string, subject: string, html: string) {
    const { data, error } = await this.resend.emails.send({
      from: 'Guardería Náutica <no-reply@guarderianautica.com',
      to,
      subject,
      html,
    });

    if (error) {
      this.logger.error(`Error enviando mail a ${to}: ${error.message}`);
      throw new Error('No se pudo enviar el email');
    }

    return data;
  }

  async sendPasswordReset(to: string, resetToken: string) {
    const link = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    return this.send(
      to,
      'Recuperar contraseña',
      `<p>Hacé click <a href="${link}">acá</a> para restablecer tu contraseña. El link expira en 1 hora.</p>`,
    );
  }

  async sendUserInvite(to: string, name: string, tempPassword: string) {
    const link = `${this.frontendUrl}/login`;

    return this.send(
      to,
      'Fuiste registrado éxitosamente en Guardería Náutica',
      `<p>Hola ${name}, un administrador te registró en la plataforma.</p>
      <p>Email: ${to}<br/>Contraseña temporal: <b>${tempPassword}</b></p>
      <p>Ingresá <a href="${link}">acá</a> y cambiala apenas inicies sesión.</p>`,
    );
  }

  async sendServiceCompleted(to: string, serviceName: string) {
    return this.send(
      to,
      'Tu servicio fue completado',
      `<p>El servicio "${serviceName}" que solicitaste fue completado con éxito.</p>`,
    );
  }
}
