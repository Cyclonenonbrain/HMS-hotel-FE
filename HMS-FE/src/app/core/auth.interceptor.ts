import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError, map } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');
  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(authReq).pipe(
    map(event => {
      if (event instanceof HttpResponse) {
        const body = event.body;
        if (body && typeof body === 'object') {
          const mappedBody = {
            ...body,
            success: (body as any).code === '2001'
          };
          return event.clone({ body: mappedBody });
        }
      }
      return event;
    }),
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('currentUser');
        if (router.url !== '/login') {
          router.navigate(['/login']);
        }
      }
      return throwError(() => err);
    })
  );
};
