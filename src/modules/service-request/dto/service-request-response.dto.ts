import { ApiProperty } from '@nestjs/swagger';

import { PaginationMetaDto } from '@/common/dto/pagination-meta.dto';
import { ServiceStatus } from '@/generated/prisma/client';

export class ServiceRequestListItemDto {
  @ApiProperty() id!: number;
  @ApiProperty() serviceTypeName!: string;
  @ApiProperty({ type: String, nullable: true }) employeeName!: string | null;
  @ApiProperty() boatName!: string;
  @ApiProperty({ example: '24/5/2025 10:00' }) dateLabel!: string;
  @ApiProperty() dateISO!: string;
  @ApiProperty({ enum: ServiceStatus }) status!: ServiceStatus;
  @ApiProperty() href!: string;
}

export class PaginatedServiceRequestsDto {
  @ApiProperty({ type: [ServiceRequestListItemDto] })
  data!: ServiceRequestListItemDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class ServiceRequestDetailDto {
  @ApiProperty() id!: number;
  @ApiProperty({ enum: ServiceStatus }) status!: ServiceStatus;
  @ApiProperty() serviceTypeName!: string;
  @ApiProperty() boatName!: string;
  @ApiProperty() clientName!: string;
  @ApiProperty() requestedAtLabel!: string;
  @ApiProperty({ type: String, nullable: true }) scheduledDateLabel!:
    | string
    | null;
  @ApiProperty({ type: String, nullable: true }) scheduledTime!: string | null;
  @ApiProperty({ type: String, nullable: true }) sector!: string | null;
  @ApiProperty({ type: String, nullable: true }) observations!: string | null;
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Siempre null para socios',
  })
  internalComment!: string | null;
  @ApiProperty({ type: String, nullable: true }) employeeName!: string | null;
  @ApiProperty() canCancel!: boolean;
  @ApiProperty() canUpdateStatus!: boolean;
  @ApiProperty() canEditComment!: boolean;
}

export class CreateServiceRequestsResponseDto {
  @ApiProperty() success!: boolean;
  @ApiProperty({ description: 'Cantidad de solicitudes creadas' })
  count!: number;
}
