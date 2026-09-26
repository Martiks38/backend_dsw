import { Prisma, type ServiceStatus } from '@/generated/prisma/client';

export type ServiceRequestWithRelations = Prisma.ServiceRequestGetPayload<{
  include: { member: true; boat: true; serviceType: true };
}>;

export type ServiceRequestWithMemberAndBoat = Prisma.ServiceRequestGetPayload<{
  include: { member: true; boat: true };
}>;

export interface ServiceRequestListItem {
  id: number;
  serviceTypeName: string;
  boatName: string;
  dateLabel: string;
  dateISO: string;
  status: ServiceStatus;
  href: string;
}

export interface ServiceRequestDetail {
  id: number;
  status: ServiceStatus;
  serviceTypeName: string;
  boatName: string;
  clientName: string;
  requestedAtLabel: string;
  scheduledDateLabel: string | null;
  scheduledTime: string | null;
  sector: string | null;
  observations: string | null;
  internalComment: string | null; // null para MEMBER, siempre
  employeeName: string | null;
  canCancel: boolean;
  canUpdateStatus: boolean;
  canEditComment: boolean;
  isDepartureService: boolean;
  departure: {
    exitedAtLabel: string;
    estimatedReturnLabel: string;
    realReturnLabel: string | null;
  } | null;
}

export interface ServiceRequestListItem {
  id: number;
  serviceTypeName: string;
  boatName: string;
  clientName: string;
  dateLabel: string;
  dateISO: string;
  status: ServiceStatus;
  href: string;
}

export type StatusCounts = Record<ServiceStatus, number> & { ALL: number };

export interface GetAllPaginatedOptions {
  operatorId?: number;
  memberId?: number;
  includeStatusCounts?: boolean;
}
