import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);

  return next(req).pipe(
    catchError(error => {
      if (error.status === 0) {
        toastr.error('No se puede conectar con el servidor. Verifique su conexión.', 'Error de conexión');
      } else if (error.status === 403) {
        toastr.warning('No tiene permisos para realizar esta acción.', 'Acceso denegado');
      } else if (error.status === 404) {
        // No mostramos toast para 404, se maneja en el componente
      } else if (error.status === 422 || error.status === 400) {
        const message = error.error?.message;
        if (Array.isArray(message)) {
          toastr.error(message.join(', '), 'Error de validación');
        } else if (typeof message === 'string') {
          toastr.error(message, 'Error de validación');
        }
      } else if (error.status === 429) {
        toastr.warning('Demasiadas solicitudes. Espere un momento.', 'Límite de peticiones');
      } else if (error.status >= 500) {
        toastr.error('Error interno del servidor. Intente más tarde.', 'Error del servidor');
      }

      return throwError(() => error);
    }),
  );
};
