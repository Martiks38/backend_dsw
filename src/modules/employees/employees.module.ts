import { Module } from '@nestjs/common';

import { ProvisioningModule } from '../common/provisioning.module';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService],
  imports: [ProvisioningModule],
})
export class EmployeesModule {}
