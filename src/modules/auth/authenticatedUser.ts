import { Role } from './role.enum';

export interface AuthenticatedUser {
  sub: string;
  email: string;
  role: Role;
}
