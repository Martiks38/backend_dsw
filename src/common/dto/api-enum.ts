import { ServiceStatus } from '@/generated/prisma/enums';

export const SERVICE_REQUEST_STATUSES = Object.values(ServiceStatus);

export const EMPLOYEE_TYPES = ['ADMIN', 'OPERATOR'] as const;

export const BOAT_ADMIN_STATUSES = [
  'EN_AGUA',
  'EN_GUARDIA',
  'EN_MANTENIMIENTO',
] as const;

export type ServiceRequestStatusValue =
  (typeof SERVICE_REQUEST_STATUSES)[number];
export type EmployeeTypeValue = (typeof EMPLOYEE_TYPES)[number];
export type BoatAdminStatusValue = (typeof BOAT_ADMIN_STATUSES)[number];
