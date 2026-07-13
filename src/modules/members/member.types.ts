import { Prisma } from '@/generated/prisma/client';

export interface MemberCreate {
  userId: number;
  documentType: string | null;
  documentNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  businessName: string | null;
  publicId: string;
  phoneNumber: string;
  email: string;
}

export const memberSelect = {
  firstName: true,
  lastName: true,
  businessName: true,
  user: {
    select: {
      publicId: true,
      email: true,
      phoneNumber: true,
      documentType: true,
      documentNumber: true,
      isActive: true,
    },
  },
} satisfies Prisma.MemberSelect;

export type RawMemberWithUser = Prisma.MemberGetPayload<{
  select: typeof memberSelect;
}>;
