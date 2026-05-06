import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { isJwtTokenValid } from '../core/jwt-token.util';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = 'http://localhost:8081/api/v1/auth';
  
  // Dùng key 'access_token' thống nhất cho toàn hệ thống
  private authStatus = new BehaviorSubject<boolean>(isJwtTokenValid(localStorage.getItem('access_token')));
  isLoggedIn$ = this.authStatus.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: {email: string, password: string}): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/login`, credentials).pipe(
      tap(res => {
        // Dựa trên AuthController: Dữ liệu nằm trong res.data
        if (res && res.success && res.data) {
          const authData = res.data;
          
          localStorage.setItem('access_token', authData.access_token);
          localStorage.setItem('userRole', authData.role);
          // Lưu thông tin user để hiển thị "Welcome, ..."
          localStorage.setItem('currentUser', JSON.stringify(authData));
          
          this.authStatus.next(true);
          console.log('✅ Login thành công & đã lưu token vào LocalStorage');
        }
      })
    );
  }

  register(data: { email: string; password: string; full_name: string; phone: string }): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/register`, data);
  }

  logout() {
    localStorage.clear();
    this.authStatus.next(false);
  }
}
