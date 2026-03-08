import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true, // Nếu dự án của bạn dùng standalone
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  showPassword = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    // Khởi tạo form với các điều kiện kiểm tra
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  // Hàm xử lý khi nhấn nút Sign In
  onSignIn(): void {
    if (this.loginForm.valid) {
      console.log('Dữ liệu đăng nhập:', this.loginForm.value);
      // Ở đây bạn sẽ gọi API để đăng nhập
      alert('Đăng nhập thành công (giả lập)!');
    } else {
      // Đánh dấu tất cả các trường là touched để hiển thị lỗi nếu có
      this.loginForm.markAllAsTouched();
    }
  }

  // Hàm ẩn/hiện mật khẩu
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}