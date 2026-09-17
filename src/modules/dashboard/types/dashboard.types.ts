import { ServiceStatus } from '@/generated/prisma/enums';

export interface TaskItem {
  id: number;
  serviceTypeName: string;
  boatName: string;
  clientName: string;
  status: ServiceStatus;
  href: string;
  scheduledAtISO: string;
  scheduledAtLabel: string;
}

export interface PendingRequestRow {
  id: number;
  clientName: string;
  boatName: string;
  dateLabel: string;
  dateISO: string;
  href: string;
}

export interface ServiceRankingItem {
  id: number;
  name: string;
  count: number;
}

export interface AdminDashboardData {
  stats: {
    clients: number;
    newClientsThisMonth: number;
    boats: number;
    newBoatsThisMonth: number;
    pendingRequests: number;
    servicesInProgressToday: number;
  };
  pendingRequests: PendingRequestRow[];
}

export interface MemberDashboardData {
  stats: {
    activeBoats: number;
    pendingRequests: number;
    servicesThisMonth: number;
    nextServiceInDays: number | null;
  };
  pendingTasks: TaskItem[];
  serviceCountsThisMonth: ServiceRankingItem[];
}

export interface OperatorDashboardData {
  stats: {
    tasksToday: number;
    inProgress: number;
    completedToday: number;
    totalThisMonth: number;
  };
  todayTasks: TaskItem[];
  topServicesThisMonth: ServiceRankingItem[];
}
