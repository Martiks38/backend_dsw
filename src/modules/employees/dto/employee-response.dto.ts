export class EmployeeResponseDto {
  publicId!: string;
  firstName!: string;
  lastName!: string;
  phoneNumber!: string;
  email!: string;
  employeeNumber!: string;
  employeeType!: string;
  licenseNumber?: string;
  isEmployee!: boolean;
  isActive!: boolean;
}
