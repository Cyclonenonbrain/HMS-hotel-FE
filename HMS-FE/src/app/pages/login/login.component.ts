import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.services';

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
  isLoading = false;
  errorMessage = '';

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

      const credentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            console.log('✅ Đăng nhập thành công:', response.data);
            
            // Lưu dữ liệu vào localStorage
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('userRole', response.data.role);
            
            // Điều hướng theo phân quyền (Role-based Navigation)
            const role = response.data.role;
            if (role === 'ADMIN') {
              this.router.navigate(['/admin/dashboard']);
            } else if (role === 'STAFF') {
              this.router.navigate(['/staff/dashboard']);
            } else {
              this.router.navigate(['/']); // Customer / Homepage
            }
          }
        },
        error: (err) => {
          this.isLoading = false;
          if (err.status === 401) {
            this.errorMessage = 'Email hoặc mật khẩu không chính xác.';
          } else {
            this.errorMessage = 'Không thể kết nối tới máy chủ. Vui lòng thử lại sau.';
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