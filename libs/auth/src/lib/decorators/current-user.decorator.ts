import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { AuthUser } from '../types.js';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest().user;
  },
);
