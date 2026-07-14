export class EmployeeResponseDto {
  publicId!: string;
  firstName!: string;
  lastName!: string;
  phoneNumber!: string;
  documentType!: string;
  documentNumber!: string;
  email!: string;
  employeeNumber!: string;
  employeeType!: string;
  licenseNumber!: string | null;
  isEmployee!: boolean;
  isActive!: boolean;
}
