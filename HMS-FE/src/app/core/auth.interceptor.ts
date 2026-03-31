import { HttpInterceptorFn } from '@angular/common/http';
import { isJwtTokenValid } from './jwt-token.util';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');

  if (isJwtTokenValid(token)) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  if (token) {
    localStorage.removeItem('access_token');
  }

  return next(req);
};
