import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CheckoutService, BookingResponse } from '../../services/checkout.services';
import { AuthService } from '../../services/auth.services';
import { VndPipe } from '../../core/vnd.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-booking-success',
  standalone: true,
  imports: [CommonModule, RouterModule, VndPipe],
  template: `
    <div class="min-h-screen bg-[#f8f8f5] font-display text-slate-900 antialiased">
      <!-- Header -->
      <header class="sticky top-0 z-50 flex items-center justify-between border-b border-primary/20 bg-white/90 backdrop-blur-md px-10 py-4 shadow-sm">
        <div class="flex items-center gap-2 cursor-pointer" routerLink="/">
          <span class="material-symbols-outlined text-3xl text-primary">hotel_class</span>
          <h2 class="text-xl font-bold tracking-tight text-primary">Luxecore</h2>
        </div>
        <nav class="hidden md:flex items-center gap-9">
          <a routerLink="/" class="text-sm font-medium text-slate-500 hover:text-primary transition-colors">Home</a>
          <a routerLink="/search" class="text-sm font-medium text-slate-500 hover:text-primary transition-colors">Rooms</a>
          <a routerLink="/my-bookings" class="text-sm font-medium text-slate-500 hover:text-primary transition-colors">My Bookings</a>
        </nav>
      </header>

      <main class="mx-auto max-w-2xl px-4 py-12">
        <!-- Loading -->
        <div *ngIf="isLoading" class="text-center py-20">
          <div class="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p class="mt-4 text-slate-500">Đang tải thông tin đặt phòng...</p>
        </div>

        <!-- Error -->
        <div *ngIf="errorMessage && !isLoading" class="text-center py-20">
          <span class="material-symbols-outlined text-6xl text-red-400">error</span>
          <h2 class="mt-4 text-2xl font-bold text-red-600">Có lỗi xảy ra</h2>
          <p class="mt-2 text-slate-500">{{ errorMessage }}</p>
          <button routerLink="/" class="mt-6 px-6 py-3 bg-primary rounded-xl font-bold text-slate-900">
            Về trang chủ
          </button>
        </div>

        <!-- Success Content -->
        <div *ngIf="!isLoading && !errorMessage && booking" class="space-y-8">
          <!-- Success Icon -->
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-full" 
                 [ngClass]="booking.status === 'CONFIRMED' ? 'bg-green-100' : 'bg-yellow-100'">
              <span class="material-symbols-outlined text-4xl" 
                    [ngClass]="booking.status === 'CONFIRMED' ? 'text-green-600' : 'text-yellow-600'">
                {{ booking.status === 'CONFIRMED' ? 'check_circle' : 'schedule' }}
              </span>
            </div>
            <h1 class="mt-4 text-3xl font-black">
              {{ booking.status === 'CONFIRMED' ? 'Đặt phòng thành công!' : 'Đang chờ thanh toán' }}
            </h1>
            <p class="mt-2 text-slate-500">
              {{ booking.status === 'CONFIRMED' 
                 ? 'Cảm ơn bạn đã đặt phòng tại Luxecore' 
                 : 'Đơn đặt phòng của bạn đang được xử lý' }}
            </p>
          </div>

          <!-- Booking Info Card -->
          <div class="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <div class="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <p class="text-xs text-slate-400 uppercase font-bold">Mã đặt phòng</p>
                <p class="text-xl font-bold font-mono">{{ booking.id | slice:0:8 }}...</p>
              </div>
              <div class="px-4 py-2 rounded-full text-xs font-bold uppercase"
                   [ngClass]="{
                     'bg-green-100 text-green-700': booking.status === 'CONFIRMED',
                     'bg-yellow-100 text-yellow-700': booking.status === 'PENDING',
                     'bg-red-100 text-red-700': booking.status === 'CANCELLED'
                   }">
                {{ booking.status }}
              </div>
            </div>

            <!-- Booking Items -->
            <div *ngFor="let item of booking.booking_items" class="py-4 border-b border-neutral-100 last:border-0">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-bold text-lg">{{ item.room_type_name }}</h3>
                  <p class="text-sm text-slate-500 mt-1">{{ item.number_of_guests }} khách</p>
                </div>
                <p class="font-bold">{{ item.snapshot_price | vnd }}</p>
              </div>
              <div class="mt-3 flex gap-6">
                <div>
                  <p class="text-xs text-slate-400 uppercase">Check-in</p>
                  <p class="font-semibold">{{ item.check_in }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 uppercase">Check-out</p>
                  <p class="font-semibold">{{ item.check_out }}</p>
                </div>
              </div>
            </div>

            <!-- Total -->
            <div class="pt-4 flex justify-between items-center">
              <span class="text-slate-500">Tổng thanh toán</span>
              <span class="text-2xl font-black">{{ booking.deposit | vnd }}</span>
            </div>

            <!-- Discount if any -->
            <div *ngIf="booking.discount_snapshot && booking.discount_snapshot > 0" 
                 class="mt-2 flex justify-between items-center text-green-600">
              <span>Giảm giá ({{ booking.coupon_code_snapshot }})</span>
              <span class="font-bold">-{{ booking.discount_snapshot | vnd }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4">
            <button routerLink="/my-bookings" 
                    class="flex-1 py-4 bg-primary rounded-xl font-bold text-slate-900 text-center hover:bg-primary/90 transition-colors">
              Xem đơn đặt phòng
            </button>
            <button routerLink="/" 
                    class="flex-1 py-4 bg-slate-100 rounded-xl font-bold text-slate-700 text-center hover:bg-slate-200 transition-colors">
              Về trang chủ
            </button>
          </div>

          <!-- Help text -->
          <p class="text-center text-sm text-slate-400">
            Thông tin đặt phòng đã được gửi đến email của bạn. 
            Nếu cần hỗ trợ, vui lòng liên hệ hotline: <span class="font-bold">1900-xxxx</span>
          </p>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class BookingSuccessComponent implements OnInit {
  booking: BookingResponse | null = null;
  isLoading = true;
  errorMessage = '';
  
  private routeSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private checkoutService: CheckoutService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const bookingId = params.get('bookingId');
      const status = params.get('status');
      
      if (bookingId) {
        this.loadBooking(bookingId);
      } else {
        this.errorMessage = 'Không tìm thấy thông tin đặt phòng';
        this.isLoading = false;
      }
    });
  }

  private loadBooking(bookingId: string): void {
    this.checkoutService.getBookingById(bookingId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.booking = response.data;
        } else {
          this.errorMessage = 'Không thể tải thông tin đặt phòng';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.message || 'Không thể tải thông tin đặt phòng';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
