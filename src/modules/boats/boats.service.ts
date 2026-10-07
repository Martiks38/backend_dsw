import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { nanoid } from 'nanoid';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateBoatDto } from './dto/create-boat.dto';
import type {
  BoatAdminListItem,
  BoatAdminStatus,
  MyBoatCard,
} from './types/boat.types';

@Injectable()
export class BoatsService {
  private readonly DEPARTURE_SERVICE_NAME = 'Botadura y retiro';

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBoatDto) {
    const registrationTaken = await this.prisma.boat.findUnique({
      where: { registrationNumber: dto.registrationNumber },
      select: { boatId: true },
    });

    if (registrationTaken) {
      throw new ConflictException({
        message: 'La matrícula ya está registrada.',
        fieldErrors: {
          registrationNumber: [
            'Esta matrícula ya pertenece a otra embarcación.',
          ],
        },
      });
    }

    const [owner, boatType] = await Promise.all([
      this.prisma.user.findUnique({
        where: { publicId: dto.ownerPublicId },
        include: { member: true },
      }),
      this.prisma.boatType.findUnique({
        where: { boatTypeId: dto.boatTypeId },
      }),
    ]);

    if (!owner?.member) throw new NotFoundException('Cliente no encontrado');

    if (!boatType)
      throw new NotFoundException('Tipo de embarcación no encontrado');

    return this.prisma.$transaction(async (tx) => {
      const cradleStillFree = await tx.contract.findFirst({
        where: { cradleId: dto.cradleId, endDatetime: null },
      });
      if (cradleStillFree) {
        throw new ConflictException(
          'La cuna seleccionada ya no está disponible. Elegí otra.',
        );
      }

      const boat = await tx.boat.create({
        data: {
          publicId: nanoid(),
          name: dto.name,
          model: dto.model,
          registrationNumber: dto.registrationNumber,
          description: dto.description,
          boatTypeId: dto.boatTypeId,
          userId: owner.userId,
        },
      });

      await tx.contract.create({
        data: {
          boatId: boat.boatId,
          cradleId: dto.cradleId,
          startDatetime: new Date(dto.startDatetime),
          plannedEndDate: dto.plannedEndDate
            ? new Date(dto.plannedEndDate)
            : undefined,
        },
      });

      return { success: true, publicId: boat.publicId };
    });
  }

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

  async findAllWithStatus(): Promise<BoatAdminListItem[]> {
    const boats = await this.prisma.boat.findMany({
      where: { contracts: { some: { endDatetime: null } } },
      include: {
        boatType: true,
        member: true,
        contracts: {
          where: { endDatetime: null },
          include: { cradle: true },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    const boatIds = boats.map((b) => b.boatId);

    const [departures, maintenanceRequests] = await Promise.all([
      this.prisma.boatDeparture.findMany({
        where: { boatId: { in: boatIds } },
        orderBy: { exitedAt: 'desc' },
      }),
      this.prisma.serviceRequest.findMany({
        where: {
          boatId: { in: boatIds },
          status: 'IN_PROGRESS',
          serviceType: { name: { not: this.DEPARTURE_SERVICE_NAME } },
        },
        select: { boatId: true },
      }),
    ]);

    const latestDepartureByBoat = new Map<
      number,
      (typeof departures)[number]
    >();

    for (const d of departures) {
      if (!latestDepartureByBoat.has(d.boatId))
        latestDepartureByBoat.set(d.boatId, d);
    }

    const boatsInMaintenance = new Set(
      maintenanceRequests.map((r) => r.boatId),
    );

    return boats.map((boat) => {
      const activeContract = boat.contracts[0];
      const lastDeparture = latestDepartureByBoat.get(boat.boatId);

      let status: BoatAdminStatus;
      if (boatsInMaintenance.has(boat.boatId)) {
        status = 'EN_MANTENIMIENTO';
      } else if (lastDeparture && lastDeparture.realReturnDatetime === null) {
        status = 'EN_AGUA';
      } else {
        status = 'EN_GUARDIA';
      }

      return {
        id: boat.publicId,
        registrationNumber: boat.registrationNumber,
        name: boat.name,
        ownerName: activeContract
          ? (boat.member.businessName ??
            `${boat.member.firstName ?? ''} ${boat.member.lastName ?? ''}`.trim())
          : '',
        boatTypeName: boat.boatType.name,
        status,
        cradleCode: activeContract?.cradle.cradleCode ?? null,
        plannedEndDatetimeLabel:
          activeContract?.plannedEndDate?.toLocaleDateString('es-AR') ?? null,
      };
    });
  }

  async getAdminOverview() {
    const boats = await this.findAllWithStatus();

    const stats = {
      total: boats.length,
      enAgua: boats.filter((b) => b.status === 'EN_AGUA').length,
      enGuardia: boats.filter((b) => b.status === 'EN_GUARDIA').length,
      enMantenimiento: boats.filter((b) => b.status === 'EN_MANTENIMIENTO')
        .length,
    };

    return { data: boats, stats };
  }

  async getGuardiaOverview() {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [contracts, totalCradles, boats] = await Promise.all([
      this.prisma.contract.findMany({
        where: { endDatetime: null },
        select: {
          startDatetime: true,
          plannedEndDate: true,
          cradleId: true,
        },
      }),
      this.prisma.cradle.count(),
      this.findAllWithStatus(),
    ]);

    const occupiedCradles = new Set(contracts.map((c) => c.cradleId)).size;

    const upcomingDepartures = contracts.filter(
      (c) =>
        c.plannedEndDate &&
        c.plannedEndDate <= in30Days &&
        c.plannedEndDate >= now,
    ).length;

    const avgStayDays = contracts.length
      ? Math.round(
          contracts.reduce(
            (sum, c) =>
              sum + (now.getTime() - c.startDatetime.getTime()) / 86_400_000,
            0,
          ) / contracts.length,
        )
      : 0;

    return {
      data: boats,
      stats: {
        totalEnGuardia: boats.length,
        occupiedCradles,
        totalCradles,
        upcomingDepartures,
        avgStayDays,
      },
    };
  }
}
