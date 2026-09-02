import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './modules/auth/auth.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { MailModule } from './modules/mail/mail.module';
import { MembersModule } from './modules/members/members.module';
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
