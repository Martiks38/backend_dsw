import { Prisma, type ServiceStatus } from '@/generated/prisma/client';

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
  internalComment: string | null;
  employeeName: string | null;
  canCancel: boolean;
  canUpdateStatus: boolean;
  canEditComment: boolean;
}

export type ServiceRequestWithRelations = Prisma.ServiceRequestGetPayload<{
  include: { member: true; boat: true; serviceType: true; employee: true };
}>;

export type ServiceRequestWithMemberAndBoat = Prisma.ServiceRequestGetPayload<{
  include: { member: true; boat: true };
}>;

export interface ServiceRequestListItem {
  id: number;
  serviceTypeName: string;
  employeeName: string | null;
  boatName: string;
  dateLabel: string;
  dateISO: string;
  status: ServiceStatus;
  href: string;
}

export interface ServiceRequestTodayItem {
  id: number;
  serviceTypeName: string;
  boatName: string;
  clientName: string;
  status: ServiceStatus;
  href: string;
  scheduledAtISO: string;
  scheduledAtLabel: string;
}
