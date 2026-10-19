import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { getClientName } from '@/common/utils/getClientName.util';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

import { CreateBoatDepartureDto } from './dto/create-boat-departure.dto';
import { FindActiveBoatDeparturesDto } from './dto/find-active-boat-departures.dto';

@Injectable()
export class BoatDepartureService {
  private readonly DEPARTURE_SERVICE_NAME = 'Botadura y retiro';
  private readonly DEFAULT_RETURN_MS = 4 * 60 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBoatDepartureDto, operatorId: number) {
    const boat = await this.prisma.boat.findUnique({
      where: { publicId: dto.publicId },
    });

    if (!boat) {
      throw new NotFoundException('Embarcación no encontrada');
    }

    const openDeparture = await this.prisma.boatDeparture.findFirst({
      where: { boatId: boat.boatId, realReturnDatetime: null },
      select: { boatDepartureId: true },
    });

    if (openDeparture) {
      throw new ConflictException('Esta embarcación ya está en el agua');
    }

    const serviceRequest = await this.prisma.serviceRequest.findFirst({
      where: {
        boatId: boat.boatId,
        boatDeparture: null,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        serviceType: { name: this.DEPARTURE_SERVICE_NAME },
      },
      orderBy: { scheduledDate: 'asc' },
    });

    const exitedAt = new Date();
    const estimatedReturnDatetime = dto.estimatedReturnDatetime
      ? new Date(dto.estimatedReturnDatetime)
      : new Date(exitedAt.getTime() + this.DEFAULT_RETURN_MS);

    if (estimatedReturnDatetime <= exitedAt) {
      throw new BadRequestException(
        'La fecha de retorno estimado debe ser posterior a la salida',
      );
    }

    const created = await this.prisma.$transaction(async (tx) => {
      let linkedRequest = serviceRequest;

      if (!linkedRequest) {
        const serviceType = await tx.serviceType.findFirst({
          where: { name: this.DEPARTURE_SERVICE_NAME, isActive: true },
        });

        if (!serviceType) {
          throw new NotFoundException(
            'No existe el tipo de servicio de botadura y retiro',
          );
        }

        linkedRequest = await tx.serviceRequest.create({
          data: {
            status: 'IN_PROGRESS',
            requestedDatetime: exitedAt,
            serviceTypeId: serviceType.serviceTypeId,
            requestedByUserId: boat.userId,
            boatId: boat.boatId,
            assignedEmployeeId: operatorId,
          },
        });
      } else if (linkedRequest.status === 'SCHEDULED') {
        await tx.serviceRequest.update({
          where: { serviceRequestId: linkedRequest.serviceRequestId },
          data: { status: 'IN_PROGRESS' },
        });
      }

      return tx.boatDeparture.create({
        data: {
          boatId: boat.boatId,
          serviceRequestId: linkedRequest.serviceRequestId,
          exitedAt,
          estimatedReturnDatetime,
        },
      });
    });

    return this.toResponse(created, boat.publicId);
  }

  async registerReturn(id: number) {
    const departure = await this.prisma.boatDeparture.findUnique({
      where: { boatDepartureId: id },
      include: { boat: { select: { publicId: true } } },
    });

    if (!departure) {
      throw new NotFoundException(`No se encontró la salida con id ${id}`);
    }

    if (departure.realReturnDatetime) {
      throw new BadRequestException(
        'Esta salida ya tiene un retorno registrado',
      );
    }

    const updated = await this.prisma.boatDeparture.update({
      where: { boatDepartureId: id },
      data: { realReturnDatetime: new Date() },
    });

    return this.toResponse(updated, departure.boat.publicId);
  }

  async findActive(dto: FindActiveBoatDeparturesDto) {
    const { search, publicId } = dto;

    const where: Prisma.BoatDepartureWhereInput = {
      realReturnDatetime: null,
      boat: {
        ...(publicId && { publicId }),
        ...(search && {
          OR: [
            { publicId: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            {
              registrationNumber: { contains: search, mode: 'insensitive' },
            },
            {
              member: {
                OR: [
                  { firstName: { contains: search, mode: 'insensitive' } },
                  { lastName: { contains: search, mode: 'insensitive' } },
                  { businessName: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          ],
        }),
      },
    };

    const departures = await this.prisma.boatDeparture.findMany({
      where,
      include: {
        boat: {
          include: { member: true },
        },
      },
      orderBy: { exitedAt: 'desc' },
    });

    return departures.map((d) => ({
      ...this.toResponse(d, d.boat.publicId),
      boatName: d.boat.name,
      registrationNumber: d.boat.registrationNumber,
      ownerName: getClientName(d.boat.member),
    }));
  }

  private toResponse(
    departure: {
      boatDepartureId: number;
      exitedAt: Date;
      estimatedReturnDatetime: Date;
      realReturnDatetime: Date | null;
    },
    publicId: string,
  ) {
    return {
      boatDepartureId: departure.boatDepartureId,
      publicId,
      exitedAt: departure.exitedAt.toISOString(),
      estimatedReturnDatetime: departure.estimatedReturnDatetime.toISOString(),
      realReturnDatetime: departure.realReturnDatetime?.toISOString() ?? null,
    };
  }
}
