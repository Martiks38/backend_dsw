import { IsBoolean } from 'class-validator';

export class SetActiveStatusDto {
  @IsBoolean()
  isActive!: boolean;
}
