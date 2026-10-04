import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

import { hashPassword } from '@/common/utils/hashPassword.util';

import { MailService } from '../mail/mail.service';

@Injectable()
export class AccountProvisioningService {
  constructor(private readonly mailService: MailService) {}

  generateTempPassword(): string {
    return randomBytes(9).toString('base64url'); // ~12 caracteres
  }

  async hashTempPassword(tempPassword: string): Promise<string> {
    return hashPassword(tempPassword);
  }

  async sendInvitation(
    to: string,
    name: string,
    tempPassword: string,
  ): Promise<void> {
    await this.mailService.sendUserInvite(to, name, tempPassword);
  }
}
