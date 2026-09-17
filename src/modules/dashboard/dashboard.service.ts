import { Injectable } from '@nestjs/common';

import { type Member, Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

import type {
  ServiceRequestWithMemberAndBoat,
  ServiceRequestWithRelations,
} from '../service-request/types/service-request.type';
import type {
  AdminDashboardData,
  MemberDashboardData,
  OperatorDashboardData,
  PendingRequestRow,
  ServiceRankingItem,
  TaskItem,
} from './types/dashboard.types';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOperatorDashboard(
    operatorId: number,
  ): Promise<OperatorDashboardData> {
    const { startOfDay, endOfDay, startOfMonth } = this.getDateRanges();

    const [todayTasks, tasksToday, inProgress, completedToday, totalThisMonth] =
      await this.prisma.$transaction([
        this.prisma.serviceRequest.findMany({
          where: {
            assignedEmployeeId: operatorId,
            scheduledDate: { gte: startOfDay, lte: endOfDay },
          },
          orderBy: { scheduledTime: 'asc' },
          include: { member: true, boat: true, serviceType: true },
        }),
        this.prisma.serviceRequest.count({
          where: {
            assignedEmployeeId: operatorId,
            scheduledDate: { gte: startOfDay, lte: endOfDay },
          },
        }),
        this.prisma.serviceRequest.count({
          where: {
            assignedEmployeeId: operatorId,
            status: 'IN_PROGRESS',
            scheduledDate: { gte: startOfDay, lte: endOfDay },
          },
        }),
        this.prisma.serviceRequest.count({
          where: {
            assignedEmployeeId: operatorId,
            status: 'COMPLETED',
            scheduledDate: { gte: startOfDay, lte: endOfDay },
          },
        }),
        this.prisma.serviceRequest.count({
          where: {
            assignedEmployeeId: operatorId,
            scheduledDate: { gte: startOfDay },
          },
        }),
      ]);

    const topServices = await this.getTopServices({
      assignedEmployeeId: operatorId,
      scheduledDate: { gte: startOfMonth },
    });

    return {
      stats: { tasksToday, inProgress, completedToday, totalThisMonth },
      todayTasks: todayTasks.map((tt) => this.mapToTaskItem(tt)),
      topServicesThisMonth: topServices,
    };
  }

  async getAdminDashboard(): Promise<AdminDashboardData> {
    const { startOfDay, endOfDay, startOfMonth } = this.getDateRanges();

    const [
      clients,
      newClientsThisMonth,
      boats,
      newBoatsThisMonth,
      pendingRequests,
      servicesInProgressToday,
      pendingRows,
    ] = await this.prisma.$transaction([
      this.prisma.member.count(),
      this.prisma.member.count({
        where: { user: { createdAt: { gte: startOfMonth } } },
      }),
      this.prisma.boat.count(),
      this.prisma.boat.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.serviceRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.serviceRequest.count({
        where: {
          status: 'IN_PROGRESS',
          scheduledDate: { gte: startOfDay, lte: endOfDay },
        },
      }),
      this.prisma.serviceRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { member: true, boat: true, serviceType: true },
      }),
    ]);

    return {
      stats: {
        clients,
        newClientsThisMonth,
        boats,
        newBoatsThisMonth,
        pendingRequests,
        servicesInProgressToday,
      },
      pendingRequests: pendingRows.map((pr) => this.mapToPendingRow(pr)),
    };
  }

  async getMemberDashboard(memberId: number): Promise<MemberDashboardData> {
    const { startOfMonth } = this.getDateRanges();

    const [
      boats,
      pendingRequests,
      servicesThisMonth,
      pendingRows,
      nextService,
    ] = await this.prisma.$transaction([
      this.prisma.boat.count({ where: { userId: memberId } }),
      this.prisma.serviceRequest.count({
        where: { requestedByUserId: memberId, status: 'PENDING' },
      }),
      this.prisma.serviceRequest.count({
        where: {
          requestedByUserId: memberId,
          scheduledDate: { gte: startOfMonth },
        },
      }),
      this.prisma.serviceRequest.findMany({
        where: {
          requestedByUserId: memberId,
          status: { in: ['PENDING', 'SCHEDULED'] },
        },
        orderBy: { scheduledDate: 'asc' },
        take: 10,
        include: { member: true, boat: true, serviceType: true },
      }),

      this.prisma.serviceRequest.findFirst({
        where: {
          requestedByUserId: memberId,
          status: { in: ['SCHEDULED', 'PENDING'] },
          scheduledDate: { gte: new Date() },
        },
        orderBy: { scheduledDate: 'asc' },
      }),
    ]);

    const serviceCounts = await this.getTopServices({
      requestedByUserId: memberId,
      scheduledDate: { gte: startOfMonth },
    });

    const nextServiceInDays = nextService?.scheduledDate
      ? Math.ceil(
          (nextService.scheduledDate.getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    return {
      stats: {
        activeBoats: boats,
        pendingRequests,
        servicesThisMonth,
        nextServiceInDays,
      },
      pendingTasks: pendingRows.map((r) => this.mapToTaskItem(r)),
      serviceCountsThisMonth: serviceCounts,
    };
  }

  private getDateRanges() {
    const today = new Date();
    const startOfDay = new Date(today);
    const endOfDay = new Date(today);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    startOfDay.setHours(0, 0, 0, 0);
    endOfDay.setHours(23, 59, 59, 999);

    return {
      startOfDay,
      endOfDay,
      startOfMonth,
    };
  }

  private async getTopServices(
    where: Prisma.ServiceRequestWhereInput,
  ): Promise<ServiceRankingItem[]> {
    const grouped = await this.prisma.serviceRequest.groupBy({
      by: ['serviceTypeId'],
      where,
      _count: { serviceTypeId: true },
      orderBy: { _count: { serviceTypeId: 'desc' } },
      take: 5,
    });

    const serviceTypes = await this.prisma.serviceType.findMany({
      where: { serviceTypeId: { in: grouped.map((g) => g.serviceTypeId) } },
    });

    return grouped.map((g) => ({
      id: g.serviceTypeId,
      name:
        serviceTypes.find((s) => s.serviceTypeId === g.serviceTypeId)?.name ??
        '',
      count: g._count.serviceTypeId,
    }));
  }

  private getClientName(member: Member) {
    return (
      member.businessName ?? `${member.firstName} ${member.lastName}`.trim()
    );
  }

  private mapToTaskItem(req: ServiceRequestWithRelations): TaskItem {
    return {
      id: req.serviceRequestId,
      scheduledAtISO: req.scheduledDate?.toISOString() ?? '',
      scheduledAtLabel: req.scheduledTime ?? '',
      serviceTypeName: req.serviceType.name,
      boatName: req.boat.name,
      clientName: this.getClientName(req.member),
      status: req.status,
      href: `/dashboard/solicitudes/${req.serviceRequestId}`,
    };
  }

  private mapToPendingRow(
    req: ServiceRequestWithMemberAndBoat,
  ): PendingRequestRow {
    return {
      id: req.serviceRequestId,
      clientName: this.getClientName(req.member),
      boatName: req.boat.name,
      dateLabel: req.scheduledDate
        ? req.scheduledDate.toLocaleDateString('es-Ar')
        : 'Sin programar',
      dateISO: req.scheduledDate?.toISOString() ?? req.createdAt.toISOString(),
      href: `/dashboard/solicitudes/${req.serviceRequestId}`,
    };
  }
}
