import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MailService } from '../mail/mail.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  private readonly recipient: string;

  constructor(
    private readonly mailService: MailService,
    configService: ConfigService,
  ) {
    this.recipient = configService.getOrThrow<string>(
      'CONTACT_EMAIL_RECIPIENT',
    );
  }

  async submit(dto: CreateContactDto): Promise<void> {
    await this.mailService.sendContactMessage(this.recipient, dto);
  }
}
