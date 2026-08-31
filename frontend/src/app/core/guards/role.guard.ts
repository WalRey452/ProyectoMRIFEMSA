import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.user();

  if (!user) {
    return router.parseUrl('/auth/login');
  }

  const expectedRoles: string[] = route.data['roles'] || [];

  if (expectedRoles.length > 0 && !expectedRoles.includes(user.role)) {
    // Navigate to default dashboard if unauthorized
    return router.parseUrl('/dashboard');
  }

  return true;
};
