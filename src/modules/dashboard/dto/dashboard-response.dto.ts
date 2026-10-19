import { ApiProperty } from '@nestjs/swagger';

import { ServiceStatus } from '@/generated/prisma/client';

export class TaskItemDto {
  @ApiProperty() id!: number;
  @ApiProperty() scheduledAtISO!: string;
  @ApiProperty() scheduledAtLabel!: string;
  @ApiProperty() serviceTypeName!: string;
  @ApiProperty() boatName!: string;
  @ApiProperty() clientName!: string;
  @ApiProperty({ enum: ServiceStatus }) status!: ServiceStatus;
  @ApiProperty() href!: string;
}

export class PendingRequestRowDto {
  @ApiProperty() id!: number;
  @ApiProperty() clientName!: string;
  @ApiProperty() boatName!: string;
  @ApiProperty() dateLabel!: string;
  @ApiProperty() dateISO!: string;
  @ApiProperty() href!: string;
}

export class ServiceRankingItemDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() count!: number;
}

export class OperatorStatsDto {
  @ApiProperty() tasksToday!: number;
  @ApiProperty() inProgress!: number;
  @ApiProperty() completedToday!: number;
  @ApiProperty() totalThisMonth!: number;
}

export class OperatorDashboardDto {
  @ApiProperty({ type: OperatorStatsDto }) stats!: OperatorStatsDto;
  @ApiProperty({ type: [TaskItemDto] }) todayTasks!: TaskItemDto[];
  @ApiProperty({ type: [ServiceRankingItemDto] })
  topServicesThisMonth!: ServiceRankingItemDto[];
}

export class AdminStatsDto {
  @ApiProperty() clients!: number;
  @ApiProperty() newClientsThisMonth!: number;
  @ApiProperty() boats!: number;
  @ApiProperty() newBoatsThisMonth!: number;
  @ApiProperty() pendingRequests!: number;
  @ApiProperty() servicesInProgressToday!: number;
}

export class AdminDashboardDto {
  @ApiProperty({ type: AdminStatsDto }) stats!: AdminStatsDto;
  @ApiProperty({ type: [PendingRequestRowDto] })
  pendingRequests!: PendingRequestRowDto[];
}

export class MemberStatsDto {
  @ApiProperty() activeBoats!: number;
  @ApiProperty() pendingRequests!: number;
  @ApiProperty() servicesThisMonth!: number;
  @ApiProperty({ type: Number, nullable: true }) nextServiceInDays!:
    | number
    | null;
}

export class MemberDashboardDto {
  @ApiProperty({ type: MemberStatsDto }) stats!: MemberStatsDto;
  @ApiProperty({ type: [TaskItemDto] }) pendingTasks!: TaskItemDto[];
  @ApiProperty({ type: [ServiceRankingItemDto] })
  serviceCountsThisMonth!: ServiceRankingItemDto[];
}
