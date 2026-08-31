import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditoriaService } from '../../auditoria/auditoria.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditoriaService: AuditoriaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const user = req.user;
      
      let action = 'UPDATE';
      if (method === 'POST') action = 'CREATE';
      if (method === 'DELETE') action = 'DELETE';

      return next.handle().pipe(
        tap(() => {
          this.auditoriaService.log({
            userId: user?.id || null,
            username: user?.username || 'Sistema',
            action,
            entityType: 'Desconocido', // Este valor debería ajustarse por el controlador
            description: `Se realizó la acción ${action} en la ruta ${req.url}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            metadata: { body: req.body, query: req.query }
          }).catch(err => console.error('Error guardando auditoria:', err));
        }),
      );
    }

    return next.handle();
  }
}
