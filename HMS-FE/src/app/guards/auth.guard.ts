import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isJwtTokenValid } from '../core/jwt-token.util';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');

  if (isJwtTokenValid(token)) {
    return true;
  }

  if (token) {
    localStorage.removeItem('access_token');
  }

  // Not logged in, redirect to login page
  router.navigate(['/login']);
  return false;
};
