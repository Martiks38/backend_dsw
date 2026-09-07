import { AppRole } from '@/modules/auth/role.enum';

const EMPLOYEE_TYPE_TO_ROLE: Record<string, AppRole> = {
  admin: AppRole.ADMIN,
  operator: AppRole.OPERATOR,
};

export function getUserRole(user: {
  publicId: string;
  isActive: boolean;
  employee: { employeeType: string } | null;
}): AppRole {
  if (!user.employee) {
    return AppRole.MEMBER;
  }

  const role = EMPLOYEE_TYPE_TO_ROLE[user.employee.employeeType.toLowerCase()];

  if (!role) {
    throw new Error(
      `Tipo de usuario desconocido: ${user.employee.employeeType}`,
    );
  }

  return role;
}
