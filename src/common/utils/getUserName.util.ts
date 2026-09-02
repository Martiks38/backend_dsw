type MemberNameFields = {
  firstName: string | null;
  lastName: string | null;
  businessName: string | null;
};

type EmployeeNameFields = {
  firstName: string;
  lastName: string;
};

export function getDisplayName(user: {
  employee: EmployeeNameFields | null;
  member: MemberNameFields | null;
}): string {
  if (user.employee) {
    return `${user.employee.firstName} ${user.employee.lastName}`;
  }

  if (user.member) {
    const { firstName, lastName, businessName } = user.member;

    if (businessName) return businessName;
    if (firstName && lastName) return `${firstName} ${lastName}`;
  }

  throw new Error(
    `Usuario ${user.employee || user.member ? '' : 'sin employee ni member '}con datos de nombre incompletos`,
  );
}
