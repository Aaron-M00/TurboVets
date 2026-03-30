import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { AuditService } from './audit.service';
import type { AuthUser } from '@app/auth';

const METHOD_TO_ACTION: Record<string, string> = {
  GET: 'read',
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const user: AuthUser | undefined = req.user;
    if (!user) return next.handle();

    const resource = (req.route?.path ?? req.url).split('/').filter(Boolean)[1] ?? 'unknown';
    const action = METHOD_TO_ACTION[req.method] ?? req.method.toLowerCase();
    const resourceId: string | null = req.params?.id ?? null;

    return next.handle().pipe(
      tap(() =>
        this.audit.record({
          userId: user.id,
          userEmail: user.email,
          action,
          resource,
          resourceId,
          organizationId: user.organizationId,
          outcome: 'allowed',
        }),
      ),
      catchError((err) => {
        const isAccessError = err?.status === 401 || err?.status === 403;
        if (isAccessError) {
          this.audit.record({
            userId: user.id,
            userEmail: user.email,
            action,
            resource,
            resourceId,
            organizationId: user.organizationId,
            outcome: 'denied',
          });
        }
        return throwError(() => err);
      }),
    );
  }
}
