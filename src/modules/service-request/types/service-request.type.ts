import { Prisma, type ServiceStatus } from '@/generated/prisma/client';

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
