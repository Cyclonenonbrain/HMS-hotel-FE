import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Try to get token from localStorage, or use a default one for now
  const token = localStorage.getItem('token');
  
  // If we have a token, clone the request and add the Authorization header
  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  }

  // Right now since there is no login implementation,
  // we might just pass a mock token or let it go through as is.
  // For backend testing, we will pass a placeholder "mock-admin-token"
  // just in case the backend expects *some* token until real login is built.
  const mockReq = req.clone({
    headers: req.headers.set('Authorization', 'Bearer mock-admin-token')
  });

  return next(mockReq); // Try with mockReq if strict, or req if not
};
