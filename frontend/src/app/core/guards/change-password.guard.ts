import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const changePasswordGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.user();
  const isOnChangePasswordPage = state.url.includes('/auth/change-password');

  if (user?.mustChangePassword && !isOnChangePasswordPage) {
    router.navigate(['/auth/change-password']);
    return false;
  }

  return true;
};
