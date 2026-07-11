import { Prisma } from '@/generated/prisma/client';

export const employeeSelect = {
  firstName: true,
  lastName: true,
  licenseNumber: true,
  employeeNumber: true,
  employeeType: true,
  user: {
    select: {
      publicId: true,
      email: true,
      phoneNumber: true,
      isActive: true,
      isEmployee: true,
    },
  },
} satisfies Prisma.EmployeeSelect;

export type RawEmployeeWithUser = Prisma.EmployeeGetPayload<{
  select: typeof employeeSelect;
}>;
