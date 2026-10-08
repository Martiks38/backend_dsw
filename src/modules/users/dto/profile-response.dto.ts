// import { ApiProperty } from '@nestjs/swagger';

// import { EMPLOYEE_TYPES, type EmployeeTypeValue } from '@/common/dto/api-enums';

// export class EmployeeProfileResponseDto {
//   @ApiProperty({ enum: ['employee'], example: 'employee' })
//   type!: 'employee';

//   @ApiProperty({ example: 'Lucía' })
//   firstName!: string;

//   @ApiProperty({ example: 'Fernández' })
//   lastName!: string;

//   @ApiProperty({ example: 'lucia@gaghiel.com' })
//   email!: string;

//   @ApiProperty({ example: '+54 341 555-0101' })
//   phoneNumber!: string;

//   @ApiProperty({
//     description: 'Tipo de empleado',
//     enum: EMPLOYEE_TYPES,
//     enumName: 'EmployeeType',
//     example: 'OPERATOR',
//   })
//   role!: EmployeeTypeValue;

//   @ApiProperty({
//     description: 'Fecha de alta formateada (es-AR)',
//     example: '15/3/2025',
//   })
//   joinedAtLabel!: string;
// }

// export class BusinessProfileResponseDto {
//   @ApiProperty({ enum: ['business'], example: 'business' })
//   type!: 'business';

//   @ApiProperty({ example: 'Astillero del Sur S.R.L.' })
//   businessName!: string;

//   @ApiProperty({ example: 'contacto@astillerodelsur.com' })
//   email!: string;

//   @ApiProperty({ example: '+54 341 555-0202' })
//   phoneNumber!: string;

//   @ApiProperty({ description: 'CUIT', example: '30712345678' })
//   documentNumber!: string;
// }

// export class IndividualProfileResponseDto {
//   @ApiProperty({ enum: ['individual'], example: 'individual' })
//   type!: 'individual';

//   @ApiProperty({ example: 'Martín' })
//   firstName!: string;

//   @ApiProperty({ example: 'Gómez' })
//   lastName!: string;

//   @ApiProperty({ example: 'martin@correo.com' })
//   email!: string;

//   @ApiProperty({ example: '+54 341 555-0303' })
//   phoneNumber!: string;

//   @ApiProperty({ description: 'DNI', example: '30123456' })
//   documentNumber!: string;
// }
