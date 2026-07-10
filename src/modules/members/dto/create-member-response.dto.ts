export class CreateMemberResponseDto {
  publicId!: string;
  email!: string;
  phoneNumber!: string;
  documentType!: string | null;
  documentNumber!: string | null;
  firstName!: string | null;
  lastName!: string | null;
  businessName!: string | null;
}
