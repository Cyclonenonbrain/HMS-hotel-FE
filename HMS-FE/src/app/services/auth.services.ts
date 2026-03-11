import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { ApiResponse, AuthResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = 'http://localhost:8081/api/v1/auth';

  // Quản lý trạng thái đăng nhập
  private authStatus = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.authStatus.asObservable();

  constructor(private http: HttpClient) {}

  private hasToken(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  login(credentials: {email: string, password: string}): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.data.accessToken) {
          localStorage.setItem('accessToken', res.data.accessToken);
          localStorage.setItem('userRole', res.data.role);
          // Lưu thêm tên để hiển thị profile
          localStorage.setItem('currentUser', JSON.stringify(res.data));
          
          this.authStatus.next(true); // Phát tín hiệu đã login thành công
        }
      })
    );
  }

  logout() {
    localStorage.clear();
    this.authStatus.next(false); // Phát tín hiệu đã logout
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }
}