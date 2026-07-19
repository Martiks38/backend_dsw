import { ConflictException, Logger } from '@nestjs/common';

import { Prisma } from '@/generated/prisma/client';

export function handlePrismaError(
  error: unknown,
  logger: Logger,
  context: string,
  conflictMessage = 'El recurso ya existe con esos datos',
): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    logger.warn(`Colisión P2002 al ${context}`);
    throw new ConflictException(conflictMessage);
  }

  logger.error(`Error inesperado al ${context}`, (error as Error).stack);
  throw error;
}
