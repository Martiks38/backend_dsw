import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './modules/auth/auth.module';
import { BoatDeparturesModule } from './modules/boat-departures/boat-departure.module';
import { BoatsModule } from './modules/boats/boats.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ContactModule } from './modules/contact/contact.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { MailModule } from './modules/mail/mail.module';
import { ServiceRequestModule } from './modules/service-request/service-request.module';
import { ServiceTypesModule } from './modules/service-types/service-types.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    ContactModule,
    EmployeesModule,
    AuthModule,
    MailModule,
    BoatDeparturesModule,
    ServiceRequestModule,
    DashboardModule,
    BoatsModule,
    ServiceTypesModule,
    UsersModule,
    ClientsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
