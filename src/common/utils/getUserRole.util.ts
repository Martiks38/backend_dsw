import { Role } from '@/modules/auth/role.enum';

const EMPLOYEE_TYPE_TO_ROLE: Record<string, Role> = {
  admin: Role.ADMIN,
  operator: Role.OPERATOR,
};

export function getUserRole(user: {
  publicId: string;
  isActive: boolean;
  employee: { employeeType: string } | null;
}): Role {
  if (!user.employee) {
    return Role.MEMBER;
  }

  const role = EMPLOYEE_TYPE_TO_ROLE[user.employee.employeeType.toLowerCase()];

  if (!role) {
    throw new Error(
      `Tipo de usuario desconocido: ${user.employee.employeeType}`,
    );
  }

  return role;
}
