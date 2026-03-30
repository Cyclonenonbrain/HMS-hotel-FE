import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userRole = localStorage.getItem('userRole'); // Assuming 'ADMIN' | 'STAFF' | 'CUSTOMER'

  const expectedRoles = route.data['expectedRoles'] as Array<string>;

  if (userRole && expectedRoles && expectedRoles.includes(userRole)) {
    return true; // Use has the required role
  }

  // Fallback redirection based on role, or to unauthorized/login
  if (userRole === 'ADMIN') {
    router.navigate(['/admin/dashboard']);
  } else if (userRole === 'STAFF') {
    router.navigate(['/staff/dashboard']);
  } else {
    // Customer or unauthenticated
    router.navigate(['/']);
  }
  
  return false;
};
