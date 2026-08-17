import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject, switchMap, map, of, catchError } from 'rxjs';
import { isJwtTokenValid } from '../core/jwt-token.util';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  
  private authStatus = new BehaviorSubject<boolean>(isJwtTokenValid(localStorage.getItem('access_token')));
  isLoggedIn$ = this.authStatus.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: {email: string, password: string}): Observable<any> {
    const payload = {
      username: credentials.email,
      password: credentials.password
    };
    return this.http.post<any>(`${this.API_URL}/login`, payload).pipe(
      tap(res => {
        if (res && res.success && res.data) {
          const authData = res.data;
          localStorage.setItem('access_token', authData.accessToken || authData.access_token);
        }
      }),
      switchMap(res => {
        if (res && res.success && res.data) {
          return this.http.get<any>(`${environment.apiUrl}/users/profile`).pipe(
            tap(profileRes => {
              if (profileRes && profileRes.success && profileRes.data) {
                const profile = profileRes.data;
                const roleList = Array.from(profile.roles || []);
                const role = roleList.length > 0 ? roleList[0] : 'CUSTOMER';
                localStorage.setItem('userRole', String(role));
                
                const currentUserData = {
                  username: profile.username,
                  email: profile.email,
                  full_name: profile.fullName,
                  role: role
                };
                localStorage.setItem('currentUser', JSON.stringify(currentUserData));
                this.authStatus.next(true);
                console.log('✅ Đăng nhập thành công & đã lưu profile vào LocalStorage');
              }
            }),
            map(profileRes => {
              const roleList = Array.from(profileRes.data?.roles || []);
              const role = roleList.length > 0 ? roleList[0] : 'CUSTOMER';
              return {
                ...res,
                data: {
                  ...res.data,
                  role: role,
                  currentUser: profileRes.data
                }
              };
            }),
            catchError(() => {
              localStorage.setItem('userRole', 'CUSTOMER');
              this.authStatus.next(true);
              return of({
                ...res,
                data: {
                  ...res.data,
                  role: 'CUSTOMER'
                }
              });
            })
          );
        }
        return of(res);
      })
    );
  }

  register(data: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/register`, data);
  }

  logout() {
    localStorage.clear();
    this.authStatus.next(false);
  }
}
