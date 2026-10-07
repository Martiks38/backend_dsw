import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { type PaginatedResult } from '@/common/types';
import { getClientName } from '@/common/utils/getClientName.util';
import { Prisma, ServiceRequest } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

import { AuthenticatedUser } from '../auth/auth.interface';
import { AppRole } from '../auth/role.enum';
import { AssignServiceRequestDto } from './dto/assign.dto';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { FindServiceRequestDto } from './dto/find-service-request.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';
import type {
  ServiceRequestDetail,
  ServiceRequestListItem,
  ServiceRequestWithRelations,
} from './types/service-request.type';

@Injectable()
export class ServiceRequestService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(
    id: number,
    user: AuthenticatedUser,
  ): Promise<ServiceRequestDetail> {
    const req = await this.prisma.serviceRequest.findUnique({
      where: { serviceRequestId: id },
      include: { member: true, boat: true, serviceType: true, employee: true },
    });

    if (!req) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    const isOwner = req.requestedByUserId === user.internalId;
    const isAssignedOperator = req.assignedEmployeeId === user.internalId;

    if (user.role === AppRole.MEMBER && !isOwner) {
      throw new ForbiddenException('Esta solicitud no te pertenece');
    }

    if (user.role === AppRole.OPERATOR && !isAssignedOperator) {
      throw new ForbiddenException('Esta solicitud no está asignada a vos');
    }

    const isStaff =
      user.role === AppRole.OPERATOR || user.role === AppRole.ADMIN;

    return {
      id: req.serviceRequestId,
      status: req.status,
      serviceTypeName: req.serviceType.name,
      boatName: req.boat.name,
      clientName: getClientName(req.member),
      requestedAtLabel: req.requestedDatetime.toLocaleDateString('es-AR'),
      scheduledDateLabel:
        req.scheduledDate?.toLocaleDateString('es-AR') ?? null,
      scheduledTime: req.scheduledTime,
      sector: req.sector,
      observations: req.observations,
      internalComment: isStaff ? req.internalComment : null,
      employeeName: req.employee
        ? `${req.employee.firstName} ${req.employee.lastName}`
        : null,
      canCancel:
        user.role === AppRole.MEMBER && isOwner && req.status === 'PENDING',
      canUpdateStatus:
        user.role === AppRole.OPERATOR &&
        isAssignedOperator &&
        (req.status === 'SCHEDULED' || req.status === 'IN_PROGRESS'),
      canEditComment:
        isStaff && (isAssignedOperator || user.role === AppRole.ADMIN),
    };
  }

  async updateManagement(
    id: number,
    dto: UpdateServiceRequestDto,
    user: AuthenticatedUser,
  ) {
    if (dto.status === undefined && dto.internalComment === undefined) {
      throw new BadRequestException('No se enviaron cambios');
    }

    const req = await this.prisma.serviceRequest.findUnique({
      where: { serviceRequestId: id },
    });
    if (!req) throw new NotFoundException('Solicitud no encontrada');

    const isAssignedOperator = req.assignedEmployeeId === user.internalId;

    if (user.role === AppRole.OPERATOR && !isAssignedOperator) {
      throw new ForbiddenException('Esta solicitud no está asignada a vos');
    }

    if (dto.status !== undefined) {
      if (user.role !== AppRole.OPERATOR) {
        throw new ForbiddenException(
          'Solo el operario asignado puede cambiar el estado',
        );
      }

      const validTransitions: Record<string, string> = {
        SCHEDULED: 'IN_PROGRESS',
        IN_PROGRESS: 'COMPLETED',
      };

      if (validTransitions[req.status] !== dto.status) {
        throw new BadRequestException(
          `No se puede pasar de "${req.status}" a "${dto.status}"`,
        );
      }
    }

    return this.prisma.serviceRequest.update({
      where: { serviceRequestId: id },
      data: {
        status: dto.status ?? undefined,
        internalComment: dto.internalComment ?? undefined,
      },
    });
  }

  async assign(id: number, dto: AssignServiceRequestDto) {
    const req = await this.prisma.serviceRequest.findUnique({
      where: { serviceRequestId: id },
    });

    if (!req) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (req.status !== 'PENDING' && req.status !== 'SCHEDULED') {
      throw new BadRequestException(
        'Solo se puede asignar una solicitud pendiente o reprogramar una ya programada',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { publicId: dto.employeeId },
      include: { employee: true },
    });

    if (!user?.employee) {
      throw new NotFoundException('Operario no encontrado');
    }

    if (user.employee.employeeType !== 'OPERATOR') {
      throw new BadRequestException('Solo se puede asignar a un operario');
    }

    return this.prisma.serviceRequest.update({
      where: { serviceRequestId: id },
      data: {
        assignedEmployeeId: user.userId,
        scheduledDate: new Date(dto.scheduledDate),
        scheduledTime: dto.scheduledTime,
        sector: dto.sector,
        status: 'SCHEDULED',
      },
    });
  }

  async cancel(id: number, user: AuthenticatedUser, reason?: string) {
    const serviceRequest = await this.findServiceRequestOrThrow(id);

    this.validateCancellationPermissions(serviceRequest, user);

    return this.prisma.serviceRequest.update({
      where: { serviceRequestId: id },
      data: {
        status: 'CANCELED',
        internalComment: reason ?? serviceRequest.internalComment,
      },
    });
  }

  private async findServiceRequestOrThrow(id: number) {
    const req = await this.prisma.serviceRequest.findUnique({
      where: { serviceRequestId: id },
    });

    if (!req) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    return req;
  }

  private validateCancellationPermissions(
    req: ServiceRequest,
    user: AuthenticatedUser,
  ) {
    switch (user.role) {
      case AppRole.MEMBER:
        if (req.requestedByUserId !== user.internalId) {
          throw new ForbiddenException('Esta solicitud no te pertenece');
        }
        if (req.status !== 'PENDING') {
          throw new BadRequestException(
            'Solo se puede cancelar una solicitud pendiente',
          );
        }
        break;

      case AppRole.ADMIN:
        if (!['PENDING', 'SCHEDULED'].includes(req.status)) {
          throw new BadRequestException(
            'No se puede cancelar una solicitud en este estado',
          );
        }
        break;

      default:
        throw new ForbiddenException(
          'No tenés permiso para cancelar solicitudes',
        );
    }
  }

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
        include: {
          member: true,
          boat: true,
          serviceType: true,
          employee: true,
        },
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
      employeeName: req.employee
        ? `${req.employee.firstName} ${req.employee.lastName}`
        : null,
      boatName: req.boat.name,
      dateLabel: `${date.toLocaleDateString('es-AR')}${req.scheduledTime ? req.scheduledTime : ''}`,
      dateISO: date.toISOString(),
      status: req.status,
      href: `/dashboard/solicitudes/${req.serviceRequestId}`,
    };
  }
}
