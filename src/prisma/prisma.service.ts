import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL');
    const adapter = new PrismaMariaDb(databaseUrl!);
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Conexión a la base de datos establecida');
    } catch (error) {
      const stackMessage =
        error instanceof Error ? error.stack : 'Error desconocido';

      this.logger.error('No se pudo conectar a la base de datos', stackMessage);

      // Interrumpe el proceso de bootstrap
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
