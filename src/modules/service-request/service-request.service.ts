import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { type PaginatedResult } from '@/common/types';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { FindServiceRequestDto } from './dto/find-service-request.dto';
import {
  type ServiceRequestListItem,
  ServiceRequestWithRelations,
} from './types/service-request.type';

@Injectable()
export class ServiceRequestService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPaginated(
    dto: FindServiceRequestDto,
    operatorId?: number,
    memberId?: number,
  ): Promise<PaginatedResult<ServiceRequestListItem>> {
    const { page, limit, status, serviceTypeId, from, until } = dto;
    const skip = (page - 1) * limit;
    const endDate = until && new Date(until);

    if (endDate) endDate.setHours(23, 59, 59, 999);

    const where: Prisma.ServiceRequestWhereInput = {
      status: status ?? undefined,
      serviceTypeId: serviceTypeId ?? undefined,
      assignedEmployeeId: operatorId ?? undefined,
      requestedByUserId: memberId ?? undefined,
      requestedDatetime: {
        gte: from ? new Date(from) : undefined,
        lte: endDate,
      },
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.serviceRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestedDatetime: 'desc' },
        include: { member: true, boat: true, serviceType: true },
      }),
      this.prisma.serviceRequest.count({ where }),
    ]);

    return {
      data: data.map((r) => this.mapToListItem(r)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTodayServiceRequestsByOperator(operatorId: number) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return this.prisma.serviceRequest.findMany({
      where: {
        assignedEmployeeId: operatorId,
        scheduledDate: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { scheduledTime: 'asc' },
      include: { member: true, boat: true },
    });
  }

  async create(dto: CreateServiceRequestDto, memberId: number) {
    const boat = await this.prisma.boat.findUnique({
      where: { publicId: dto.boatId },
    });

    if (!boat || boat.userId !== memberId) {
      throw new ForbiddenException(
        'No tienes permiso para solicitar servicios para esta embarcación',
      );
    }

    const uniqueServiceTypeIds = [...new Set(dto.serviceTypeIds)];

    const serviceTypes = await this.prisma.serviceType.findMany({
      where: { serviceTypeId: { in: uniqueServiceTypeIds }, isActive: true },
    });

    if (serviceTypes.length !== uniqueServiceTypeIds.length) {
      throw new BadRequestException('Solicitud de servicio incorrecta.');
    }

    return this.prisma.$transaction(
      dto.serviceTypeIds.map((serviceTypeId) =>
        this.prisma.serviceRequest.create({
          data: {
            status: 'PENDING',
            requestedDatetime: new Date(),
            observations: dto?.observations,
            serviceTypeId,
            requestedByUserId: memberId,
            boatId: boat.boatId,
          },
        }),
      ),
    );
  }

  private mapToListItem(
    req: ServiceRequestWithRelations,
  ): ServiceRequestListItem {
    const date = req.scheduledDate ?? req.requestedDatetime;

    return {
      id: req.serviceRequestId,
      serviceTypeName: req.serviceType.name,
      boatName: req.boat.name,
      dateLabel: `${date.toLocaleDateString('es-AR')}${req.scheduledTime ? req.scheduledTime : ''}`,
      dateISO: date.toISOString(),
      status: req.status,
      href: `/dashboard/solicitudes/${req.serviceRequestId}`,
    };
  }
}
