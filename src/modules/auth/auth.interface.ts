import type { Request } from 'express';

import { Role } from './role.enum';

export interface AuthenticatedUser {
  sub: string;
  role: Role;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
