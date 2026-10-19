import { ApiProperty } from '@nestjs/swagger';

import { PaginationMetaDto } from '@/common/dto/pagination-meta.dto';

export class ClientOptionDto {
  @ApiProperty() publicId!: string;
  @ApiProperty() name!: string;
}

export class ClientListItemDto extends ClientOptionDto {
  @ApiProperty() email!: string;
  @ApiProperty() phoneNumber!: string;
  @ApiProperty() isActive!: boolean;
}

export class ClientsStatsDto {
  @ApiProperty() total!: number;
  @ApiProperty() active!: number;
  @ApiProperty() inactive!: number;
  @ApiProperty({ description: 'Altas del mes calendario en curso' })
  newThisMonth!: number;
}

export class PaginatedClientsDto {
  @ApiProperty({ type: [ClientListItemDto] }) data!: ClientListItemDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
  @ApiProperty({ type: ClientsStatsDto }) stats!: ClientsStatsDto;
}
