import { Role } from '@/modules/auth/role.enum';

export function getUserRole(user: {
  publicId: string;
  isActive: boolean;
  employee: { employeeType: string } | null;
}): string {
  const role = user?.employee
    ? user.employee.employeeType
    : Role.MEMBER.toLowerCase();

  return role;
}
