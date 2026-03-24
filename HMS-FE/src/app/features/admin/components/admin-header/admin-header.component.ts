// ... existing imports ...
import { Component, DestroyRef, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../../services/auth.services'; // Import AuthService

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.css'
})
export class AdminHeaderComponent implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService); // Inject AuthService
  private cdr = inject(ChangeDetectorRef); // Inject ChangeDetectorRef
  
  currentBreadcrumb = 'Dashboard';
  user: any = null; // Biến lưu thông tin user

  ngOnInit(): void {
    // Logic Breadcrumb
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.currentBreadcrumb = this.getBreadcrumb(this.activatedRoute.root);
      });
      
    // Initial set Breadcrumb
    this.currentBreadcrumb = this.getBreadcrumb(this.activatedRoute.root);

    // Lấy thông tin user (Tương tự Landing Page)
    const userData = localStorage.getItem('currentUser');
    this.user = userData ? JSON.parse(userData) : null;
  }

  private getBreadcrumb(route: ActivatedRoute): string {
    let breadcrumb = 'Dashboard';
    let currentRoute = route;

    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
      if (currentRoute.snapshot.data['breadcrumb']) {
        breadcrumb = currentRoute.snapshot.data['breadcrumb'];
      }
    }

    return breadcrumb;
  }

  // Hàm xử lý Đăng xuất
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']); // Điều hướng về trang login
  }
}
