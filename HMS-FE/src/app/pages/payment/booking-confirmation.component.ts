import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { CheckoutService, BookingResponse } from '../../services/checkout.services';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './booking-confirmation.component.html',
  styleUrls: ['./booking-confirmation.component.css']
})
export class BookingConfirmationComponent implements OnInit, OnDestroy {
  bookingData: BookingResponse | null = null;
  isLoading = true;
  errorMessage = '';
  bookingId = '';
  statusText = 'PENDING';
  secondsLeft = 60;
  private pollingIntervalId: any = null;
  private timeoutId: any = null;
  private routeSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private checkoutService: CheckoutService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.routeSub = this.route.queryParamMap.subscribe(params => {
      const bookingIdFromQuery = params.get('bookingId');
      const bookingIdFromRoute = this.route.snapshot.paramMap.get('id');
      this.bookingId = bookingIdFromQuery || bookingIdFromRoute || '';

      if (!this.bookingId) {
        this.isLoading = false;
        this.errorMessage = 'Không tìm thấy bookingId để xác nhận thanh toán.';
        this.cdr.detectChanges();
        return;
      }

      this.startPolling();
    });
  }

  ngOnDestroy(): void {
    this.stopPolling();
    if (this.routeSub) this.routeSub.unsubscribe();
  }

  retryPolling(): void {
    this.errorMessage = '';
    this.secondsLeft = 60;
    this.startPolling();
  }

  private startPolling(): void {
    this.stopPolling();
    this.isLoading = true;
    this.errorMessage = '';
    this.secondsLeft = 60;
    this.pollBookingStatus();

    this.pollingIntervalId = setInterval(() => {
      this.secondsLeft = Math.max(this.secondsLeft - 3, 0);
      this.pollBookingStatus();
    }, 3000);

    this.timeoutId = setTimeout(() => {
      this.stopPolling();
      this.isLoading = false;
      this.errorMessage = 'Hết thời gian chờ xác nhận thanh toán. Vui lòng thử lại.';
      this.cdr.detectChanges();
    }, 60000);
  }

  private stopPolling(): void {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private pollBookingStatus(): void {
    this.checkoutService.getBookingById(this.bookingId).subscribe({
      next: (res) => {
        if (!res.success || !res.data) {
          return;
        }
        this.bookingData = res.data;
        const currentStatus = String(res.data.status || '').toUpperCase();
        this.statusText = currentStatus;

        if (currentStatus === 'CONFIRMED') {
          this.stopPolling();
          this.isLoading = false;
          this.cdr.detectChanges();
          setTimeout(() => this.router.navigate(['/my-bookings']), 800);
          return;
        }

        if (currentStatus === 'FAILED' || currentStatus === 'CANCELLED') {
          this.stopPolling();
          this.isLoading = false;
          this.errorMessage = `Thanh toán không thành công (${currentStatus}).`;
          this.cdr.detectChanges();
          return;
        }

        this.isLoading = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error polling booking status:', err);
        // Keep polling on transient network errors
        this.isLoading = true;
        this.cdr.detectChanges();
      }
    });
  }
}
