import { Prisma } from '@/generated/prisma/client';

const _employeeSelect = {
  firstName: true,
  lastName: true,
  employeeNumber: true,
  employeeType: true,
  user: {
    select: {
      publicId: true,
      email: true,
      documentType: true,
      documentNumber: true,
      phoneNumber: true,
      isActive: true,
      isEmployee: true,
    },
  },
} satisfies Prisma.EmployeeSelect;

export interface UniqueFields {
  email: string;
  documentType: string;
  documentNumber: string;
}
