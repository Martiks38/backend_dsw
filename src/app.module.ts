import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './modules/auth/auth.module';
import { BoatsModule } from './modules/boats/boats.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { MailModule } from './modules/mail/mail.module';
import { MembersModule } from './modules/members/members.module';
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
    MembersModule,
    EmployeesModule,
    AuthModule,
    MailModule,
    ServiceRequestModule,
    DashboardModule,
    BoatsModule,
    ServiceTypesModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
