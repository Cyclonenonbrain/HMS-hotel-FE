import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { VndPipe } from '../../core/vnd.pipe';
import { AuthService } from '../../services/auth.services';
import { BookingService, MyBookingItem } from '../../services/booking.services';
import { ReviewService } from '../../services/review.service';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, VndPipe],
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.css']
})
export class MyBookingsComponent implements OnInit {
  user: any = null;
  isLoggedIn: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  bookings: MyBookingItem[] = [];
  selectedStatusFilter: 'ALL' | 'WAITING' | 'CONFIRMED' | 'COMPLETED' = 'ALL';
  reviewedBookingIds = new Set<string>();
  reviewModalOpen = false;
  reviewSubmitting = false;
  reviewError = '';
  selectedBookingForReview: MyBookingItem | null = null;
  reviewForm = {
    reviewId: '',
    rating: 5,
    comment: ''
  };

  constructor(
    private authService: AuthService,
    private bookingService: BookingService,
    private reviewService: ReviewService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
      if (status) {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          this.user = {
            ...parsedUser,
            fullName: parsedUser.full_name || parsedUser.fullName
          };
        }
        this.loadMyBookings();
      } else {
        this.user = null;
        this.router.navigate(['/login']);
      }
      this.cdr.detectChanges();
    });
  }

  private loadMyBookings() {
    this.isLoading = true;
    this.errorMessage = '';
    this.bookingService.getMyBookings().subscribe({
      next: (res) => {
        this.bookings = res?.data || [];
        this.loadReviewedState();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Không thể tải danh sách booking.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadReviewedState() {
    this.reviewedBookingIds.clear();
    const completedBookings = this.bookings.filter(b => (b.status || '').toUpperCase() === 'COMPLETED');
    completedBookings.forEach(booking => {
      this.reviewService.getReviewByBooking(booking.bookingId).subscribe({
        next: (res) => {
          if (res?.data?.id) {
            this.reviewedBookingIds.add(booking.bookingId);
            this.cdr.detectChanges();
          }
        },
        error: () => {
          // no review yet -> ignore
        }
      });
    });
  }

  getStatusBadgeClass(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'CONFIRMED':
        return 'bg-status-green text-white';
      case 'PENDING':
        return 'bg-primary text-slate-900';
      case 'CANCELLED':
        return 'bg-status-grey text-white';
      case 'FAILED':
        return 'bg-status-red text-white';
      default:
        return 'bg-slate-200 text-slate-700';
    }
  }

  getStatusLabel(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'CONFIRMED':
        return 'Confirmed';
      case 'PENDING':
        return 'Waiting for confirmation';
      case 'CANCELLED':
        return 'Cancelled';
      case 'FAILED':
        return 'Failed';
      case 'CHECKED_IN':
        return 'Checked in';
      case 'COMPLETED':
        return 'Completed';
      case 'NO_SHOW':
        return 'No show';
      default:
        return status || 'Unknown';
    }
  }

  getFallbackImage(): string {
    return 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';
  }

  get filteredBookings(): MyBookingItem[] {
    if (this.selectedStatusFilter === 'ALL') return this.bookings;

    if (this.selectedStatusFilter === 'WAITING') {
      return this.bookings.filter(b => (b.status || '').toUpperCase() === 'PENDING');
    }

    if (this.selectedStatusFilter === 'CONFIRMED') {
      return this.bookings.filter(b => (b.status || '').toUpperCase() === 'CONFIRMED');
    }

    return this.bookings.filter(b => (b.status || '').toUpperCase() === 'COMPLETED');
  }

  setStatusFilter(filter: 'ALL' | 'WAITING' | 'CONFIRMED' | 'COMPLETED') {
    this.selectedStatusFilter = filter;
  }

  setRating(star: number) {
    this.reviewForm.rating = star;
  }

  canReview(booking: MyBookingItem): boolean {
    const status = (booking.status || '').toUpperCase();
    return status === 'COMPLETED' && !this.reviewedBookingIds.has(booking.bookingId);
  }

  isReviewed(booking: MyBookingItem): boolean {
    return this.reviewedBookingIds.has(booking.bookingId);
  }

  openReviewModal(booking: MyBookingItem) {
    if (!this.canReview(booking)) return;
    this.selectedBookingForReview = booking;
    this.reviewModalOpen = true;
    this.reviewSubmitting = false;
    this.reviewError = '';
    this.reviewForm = { reviewId: '', rating: 5, comment: '' };
  }

  closeReviewModal() {
    this.reviewModalOpen = false;
    this.selectedBookingForReview = null;
    this.reviewError = '';
  }

  submitReview() {
    if (!this.selectedBookingForReview) return;
    if (!this.reviewForm.comment || this.reviewForm.comment.trim().length < 10) {
      this.reviewError = 'Nhận xét tối thiểu 10 ký tự.';
      return;
    }

    this.reviewSubmitting = true;
    this.reviewError = '';

    const bookingId = this.selectedBookingForReview.bookingId;
    const req$ = this.reviewService.createReview({
      bookingId: bookingId,
      rating: this.reviewForm.rating,
      comment: this.reviewForm.comment.trim()
    });

    req$.subscribe({
      next: () => {
        this.reviewSubmitting = false;
        this.reviewedBookingIds.add(bookingId);
        this.closeReviewModal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.reviewSubmitting = false;
        this.reviewError = err?.error?.message || 'Không thể gửi đánh giá.';
        this.cdr.detectChanges();
      }
    });
  }

  onLogout() {
    this.authService.logout();
    this.cdr.detectChanges();
  }
}
