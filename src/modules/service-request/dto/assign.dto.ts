import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class AssignServiceRequestDto {
  @IsString()
  employeeId!: string;

  @IsDateString()
  scheduledDate!: string;

  @IsString()
  @MaxLength(10)
  scheduledTime!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sector?: string;
}
