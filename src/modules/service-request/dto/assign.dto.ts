import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class AssignServiceRequestDto {
  @IsString({
    message: 'El ID público del empleado debe ser un texto',
  })
  employeeId!: string;

  @IsDateString(
    {},
    {
      message: 'La fecha programada debe tener un formato de fecha válido',
    },
  )
  scheduledDate!: string;

  @IsString({
    message: 'La hora programada debe ser un texto',
  })
  @MaxLength(10, {
    message: 'La hora programada no puede superar los 10 caracteres',
  })
  scheduledTime!: string;

  @IsOptional()
  @IsString({
    message: 'El sector debe ser un texto',
  })
  @MaxLength(100, {
    message: 'El sector no puede superar los 100 caracteres',
  })
  sector?: string;
}
