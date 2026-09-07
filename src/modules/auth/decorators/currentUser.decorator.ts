import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { type AuthenticatedUser } from '../auth.interface';

interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();

    return request.user;
  },
);
