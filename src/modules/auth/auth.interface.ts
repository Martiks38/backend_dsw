import type { Request } from 'express';

import { AppRole } from './role.enum';

export interface AuthenticatedUser {
  id: string;
  internalId: number;
  role: AppRole;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
