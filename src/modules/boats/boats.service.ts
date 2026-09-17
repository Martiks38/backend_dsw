import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { type MyBoatCard } from './types/boat.types';

@Injectable()
export class BoatsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByMember(memberId: number): Promise<MyBoatCard[]> {
    const boats = await this.prisma.boat.findMany({
      where: { userId: memberId },
      include: {
        boatType: true,
        contracts: {
          where: { endDatetime: null },
          orderBy: { startDatetime: 'desc' },
          take: 1,
          include: { cradle: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return boats.map((boat) => {
      const activeContract = boat.contracts[0] ?? null;

      const contractStartLabel = activeContract
        ? activeContract.startDatetime.toLocaleDateString('es-AR')
        : null;

      const contractStartISO = activeContract
        ? activeContract.startDatetime.toISOString()
        : '';

      return {
        id: boat.publicId,
        name: boat.name,
        model: boat.model,
        registrationNumber: boat.registrationNumber,
        boatTypeName: boat.boatType.name,
        contractStartLabel,
        contractStartISO: contractStartISO,
        cradleCode: activeContract?.cradle.cradleCode ?? null,
        isInGuardia: activeContract !== null,
      };
    });
  }
}
