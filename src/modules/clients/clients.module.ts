import { Module } from '@nestjs/common';

import { ProvisioningModule } from '../common/provisioning.module';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [ProvisioningModule],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}
