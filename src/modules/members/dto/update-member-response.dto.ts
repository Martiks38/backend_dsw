export class UpdateMemberResponseDto {
  email!: string;
  publicId!: string;
  phoneNumber!: string;
  isActive!: boolean;
  documentNumber!: string | null;
  documentType!: string | null;
  firstName!: string | null;
  lastName!: string | null;
  businessName!: string | null;
}
