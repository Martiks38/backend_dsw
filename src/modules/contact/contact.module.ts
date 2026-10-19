import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { MailModule } from '../mail/mail.module';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

@Module({
  imports: [MailModule, ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }])],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
