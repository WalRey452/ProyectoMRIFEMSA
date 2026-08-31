import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, switchMap, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.token();

  // Adjuntar token JWT en todas las rutas excepto login y refresh
  if (token && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError(error => {
      // ─── 403 Forbidden: rol insuficiente ─────────────────────────
      // El usuario está autenticado pero no tiene permisos.
      // NO cerrar sesión. Solo propagar el error.
      if (error.status === 403) {
        return throwError(() => error);
      }

      // ─── 401 Unauthorized: token inválido o expirado ────────────
      // Solo actuar en rutas que NO sean de autenticación (evita bucles)
      if (error.status === 401 && !req.url.includes('/auth/')) {
        const refreshToken = localStorage.getItem('mri_refresh_token');

        // Sin refresh token → limpiar estado y redirigir al login
        if (!refreshToken) {
          authService.clearSessionAndRedirect();
          return throwError(() => error);
        }

        // Con refresh token → intentar renovar el access token
        return authService.refreshToken().pipe(
          switchMap(response => {
            // Refresh exitoso → reintentar la petición original con el nuevo token
            const retried = req.clone({
              setHeaders: { Authorization: `Bearer ${response.accessToken}` },
            });
            return next(retried);
          }),
          catchError(refreshError => {
            // Refresh también falló → sesión completamente inválida
            authService.clearSessionAndRedirect();
            return throwError(() => refreshError);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};

