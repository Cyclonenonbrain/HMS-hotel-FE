import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // Thêm Router để điều hướng
import { AuthService } from '../../services/auth.services'; // Kiểm tra đúng đường dẫn đến file của bạn

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  showPassword = false;
  isLoading = false; // Thêm biến để hiện trạng thái đang xử lý
  errorMessage = ''; // Biến hiển thị lỗi lên UI

  // Inject AuthService và Router
  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onSignIn(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      // Lấy dữ liệu từ form: { email, password }
      const credentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      // Gọi API thật từ AuthService
      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            console.log('✅ Đăng nhập thật thành công:', response.data);
            
            // Lưu token (Service của bạn thường đã làm việc này bằng .pipe(tap...))
            localStorage.setItem('accessToken', response.data.accessToken);
            
            // Điều hướng sang trang Dashboard hoặc trang chủ
            this.router.navigate(['/']); 
          }
        },
        error: (err) => {
          this.isLoading = false;
          // Xử lý lỗi từ Backend (401, 403, 500...)
          if (err.status === 401) {
            this.errorMessage = 'Email hoặc mật khẩu không chính xác.';
          } else {
            this.errorMessage = 'Có lỗi xảy ra khi kết nối tới máy chủ.';
          }
          console.error('Login error:', err);
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}