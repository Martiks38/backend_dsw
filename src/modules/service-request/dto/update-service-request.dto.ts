import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateServiceRequestDto {
  @IsOptional()
  @IsIn(['IN_PROGRESS', 'COMPLETED'])
  status?: 'IN_PROGRESS' | 'COMPLETED';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  internalComment?: string;
}
