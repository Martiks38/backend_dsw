import { ApiProperty } from '@nestjs/swagger';

const BOAT_STATUSES = ['EN_GUARDIA', 'EN_AGUA', 'EN_MANTENIMIENTO'] as const;

export class MyBoatDto {
  @ApiProperty({ description: 'Identificador público' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() model!: string;
  @ApiProperty() registrationNumber!: string;
  @ApiProperty() boatTypeName!: string;
  @ApiProperty({ type: String, nullable: true }) contractStartLabel!:
    | string
    | null;
  @ApiProperty({ description: "Vacío ('') si no hay contrato activo" })
  contractStartISO!: string;
  @ApiProperty({ type: String, nullable: true }) cradleCode!: string | null;
  @ApiProperty() isInGuardia!: boolean;
}

export class BoatAdminListItemDto {
  @ApiProperty({ description: 'Identificador público' }) id!: string;
  @ApiProperty() registrationNumber!: string;
  @ApiProperty() name!: string;
  @ApiProperty() ownerName!: string;
  @ApiProperty() boatTypeName!: string;
  @ApiProperty({ enum: BOAT_STATUSES }) status!: (typeof BOAT_STATUSES)[number];
  @ApiProperty({ type: String, nullable: true }) cradleCode!: string | null;
  @ApiProperty({ type: String, nullable: true }) plannedEndDatetimeLabel!:
    | string
    | null;
}

export class BoatsAdminStatsDto {
  @ApiProperty() total!: number;
  @ApiProperty() enAgua!: number;
  @ApiProperty() enGuardia!: number;
  @ApiProperty() enMantenimiento!: number;
}

export class BoatsAdminOverviewDto {
  @ApiProperty({ type: [BoatAdminListItemDto] }) data!: BoatAdminListItemDto[];
  @ApiProperty({ type: BoatsAdminStatsDto }) stats!: BoatsAdminStatsDto;
}

export class GuardiaStatsDto {
  @ApiProperty() totalEnGuardia!: number;
  @ApiProperty() occupiedCradles!: number;
  @ApiProperty() totalCradles!: number;
  @ApiProperty({ description: 'Salidas previstas en los próximos 30 días' })
  upcomingDepartures!: number;
  @ApiProperty() avgStayDays!: number;
}

export class GuardiaOverviewDto {
  @ApiProperty({ type: [BoatAdminListItemDto] }) data!: BoatAdminListItemDto[];
  @ApiProperty({ type: GuardiaStatsDto }) stats!: GuardiaStatsDto;
}
