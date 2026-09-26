import { Member } from '@/generated/prisma/client';

export function getClientName(member: Member): string {
  return member.businessName ?? `${member.firstName} ${member.lastName}`.trim();
}
