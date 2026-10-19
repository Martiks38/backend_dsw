import { Module } from '@nestjs/common';

import { MailModule } from '../mail/mail.module';
import { AccountProvisioningService } from './account-provisioning.service';

@Module({
  imports: [MailModule],
  providers: [AccountProvisioningService],
  exports: [AccountProvisioningService],
})
export class ProvisioningModule {}
