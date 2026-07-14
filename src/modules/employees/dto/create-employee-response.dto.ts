export class CreateEmployeeResponseDto {
  publicId!: string;
  email!: string;
  phoneNumber!: string;
  documentType!: string | null;
  documentNumber!: string | null;
  employeeType!: string;
  employeeNumber!: string;
  licenseNumber!: string | null;
}
