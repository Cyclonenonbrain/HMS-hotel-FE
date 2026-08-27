import { Component, OnInit, ElementRef, HostListener, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CheckoutService, HoldCreateRequest, HoldConversionRequest } from '../../services/checkout.services'; 
import { PaymentService } from '../../services/payment.service';
import { CouponService, CouponValidationResponse } from '../../services/coupon.service';
import { AuthService } from '../../services/auth.services';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { VndPipe } from '../../core/vnd.pipe';

type PaymentMethod = 'ONLINE_DEPOSIT' | 'ONLINE_FULL' | 'AT_HOTEL';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule, VndPipe],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  user: any = null;
  isLoggedIn: boolean = false;
  isProfileMenuOpen = false;
  isLoading = false;
  isProcessingPayment = false;
  errorMessage = '';
  private authSub!: Subscription;

  // Room data from query params
  room = {
    id: '',                    // roomTypeId
    name: 'Executive Suite',
    type: 'Premium Suite',
    price: 0,
    serviceFee: 0,
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
  };

  bookingData = {
    fullName: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    numberOfGuests: 2
  };

  // Payment method selection
  selectedPaymentMethod: PaymentMethod = 'ONLINE_DEPOSIT';
  
  // Deposit rate (30% of room total before VAT)
  readonly DEPOSIT_RATE = 0.3;

  // Coupon state
  couponCode = '';
  couponLoading = false;
  couponError = '';
  appliedCoupon: CouponValidationResponse | null = null;

  // Validation error messages
  validationErrors = {
    fullName: '',
    email: '',
    phone: ''
  };

  constructor(
    private checkoutService: CheckoutService, 
    private paymentService: PaymentService,
    private couponService: CouponService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private eRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.readQueryParams();

    // Subscribe to auth state
    this.authSub = this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
      if (status) {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            this.user = {
              ...parsedUser,
              fullName: parsedUser.full_name || parsedUser.fullName || 'Guest Member'
            };
            
            // Auto-fill form with user data
            this.bookingData.fullName = this.user.fullName;
            this.bookingData.email = this.user.email || '';
            this.bookingData.phone = this.user.phone || '';
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
      } else {
        this.user = null;
      }
      this.cdr.detectChanges();
    });
  }

  private readQueryParams() {
    this.route.queryParams.subscribe(params => {
      if (params['roomId']) this.room.id = params['roomId'];
      if (params['roomName']) this.room.name = params['roomName'];
      if (params['roomType']) this.room.type = params['roomType'];
      if (params['price']) this.room.price = parseFloat(params['price']) || 0;
      if (params['image']) this.room.image = params['image'];
      
      if (params['checkIn']) this.bookingData.checkIn = params['checkIn'];
      if (params['checkOut']) this.bookingData.checkOut = params['checkOut'];
      if (params['guests']) this.bookingData.numberOfGuests = parseInt(params['guests'], 10) || 2;
      
      // Fallback dates if missing
      if (!this.bookingData.checkIn) {
        const today = new Date();
        this.bookingData.checkIn = today.toISOString().split('T')[0];
      }
      if (!this.bookingData.checkOut) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        this.bookingData.checkOut = tomorrow.toISOString().split('T')[0];
      }
      
      this.cdr.detectChanges();
    });
  }

  get nights(): number {
    if (!this.bookingData.checkIn || !this.bookingData.checkOut) return 1;
    const start = new Date(this.bookingData.checkIn);
    const end = new Date(this.bookingData.checkOut);
    const diff = end.getTime() - start.getTime();
    const days = Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 1);
    return days;
  }

  get roomTotal(): number {
    return this.room.price * this.nights;
  }

  get discountAmount(): number {
    if (!this.appliedCoupon || !this.appliedCoupon.is_valid) {
      return 0;
    }
    return this.appliedCoupon.discount_amount || 0;
  }

  // Room total after discount (before VAT)
  get roomTotalAfterDiscount(): number {
    return Math.max(this.roomTotal - this.discountAmount, 0);
  }

  get taxAmount(): number {
    return Math.round(this.roomTotalAfterDiscount * 0.08); // 8% VAT
  }

  get totalAmount(): number {
    return this.roomTotalAfterDiscount + this.taxAmount + this.room.serviceFee;
  }

  // Deposit = 30% of room total after discount (before VAT)
  get depositAmount(): number {
    return Math.round(this.roomTotalAfterDiscount * this.DEPOSIT_RATE);
  }

  // Amount to pay now depends on payment method
  get amountToPay(): number {
    if (this.selectedPaymentMethod === 'ONLINE_DEPOSIT') {
      return this.depositAmount;
    }
    if (this.selectedPaymentMethod === 'ONLINE_FULL') {
      return this.totalAmount;
    }
    return 0; // Pay at hotel = no upfront payment
  }

  // Remaining amount to pay at hotel
  get remainingAmount(): number {
    return this.totalAmount - this.depositAmount;
  }

  ngOnDestroy(): void {
    if (this.authSub) this.authSub.unsubscribe();
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isProfileMenuOpen = false;
    }
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  // Coupon handling
  applyCoupon() {
    if (!this.couponCode.trim()) {
      this.couponError = 'Vui lòng nhập mã giảm giá';
      return;
    }

    this.couponLoading = true;
    this.couponError = '';

    this.couponService.validateCoupon(this.couponCode.trim(), this.roomTotal).subscribe({
      next: (response) => {
        this.couponLoading = false;
        if (response.success && response.data.is_valid) {
          this.appliedCoupon = response.data;
          this.couponError = '';
        } else {
          this.appliedCoupon = null;
          this.couponError = response.data.reason || 'Mã giảm giá không hợp lệ';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.couponLoading = false;
        this.appliedCoupon = null;
        this.couponError = err.message || 'Không thể kiểm tra mã giảm giá';
        this.cdr.detectChanges();
      }
    });
  }

  removeCoupon() {
    this.appliedCoupon = null;
    this.couponCode = '';
    this.couponError = '';
  }

  // Form validation
  private validateForm(): boolean {
    this.validationErrors = { fullName: '', email: '', phone: '' };
    let isValid = true;

    if (!this.bookingData.fullName?.trim()) {
      this.validationErrors.fullName = 'Vui lòng nhập họ tên';
      isValid = false;
    }

    if (!this.bookingData.email?.trim()) {
      this.validationErrors.email = 'Vui lòng nhập email';
      isValid = false;
    } else if (!this.isValidEmail(this.bookingData.email)) {
      this.validationErrors.email = 'Email không hợp lệ';
      isValid = false;
    }

    if (!this.bookingData.phone?.trim()) {
      this.validationErrors.phone = 'Vui lòng nhập số điện thoại';
      isValid = false;
    }

    if (!this.room.id) {
      this.errorMessage = 'Không có thông tin phòng. Vui lòng quay lại chọn phòng.';
      isValid = false;
    }

    if (!this.bookingData.numberOfGuests || this.bookingData.numberOfGuests < 1) {
      this.errorMessage = 'Số lượng khách phải lớn hơn hoặc bằng 1.';
      isValid = false;
    }

    return isValid;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Main booking submission: Hold -> Convert -> PayOS
  onConfirmPayment() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.isProcessingPayment = true;
    this.errorMessage = '';

    const holdRequest: HoldCreateRequest = {
      checkIn: this.bookingData.checkIn,
      checkOut: this.bookingData.checkOut,
      lines: [{
        roomTypeId: Number(this.room.id),
        guests: Number(this.bookingData.numberOfGuests || 1),
        quantity: 1
      }]
    };

    // Bước 1: Tạo Hold
    this.checkoutService.createHold(holdRequest).subscribe({
      next: (holdRes) => {
        const holdToken = holdRes.data?.accessToken;
        if (!holdToken) {
          this.handleError('Không thể giữ phòng. Vui lòng thử lại.');
          return;
        }

        const convertRequest: HoldConversionRequest = {
          customerName: this.bookingData.fullName.trim(),
          customerPhone: this.bookingData.phone.trim(),
          customerEmail: this.bookingData.email.trim(),
          couponValidationToken: this.appliedCoupon?.validation_token || undefined
        };

        // Bước 2: Chuyển đổi Hold thành Booking
        this.checkoutService.convertHold(holdToken, convertRequest).subscribe({
          next: (convertRes) => {
            const booking = convertRes.data;
            const publicCode = booking?.publicCode;
            if (!publicCode) {
              this.handleError('Không thể tạo đơn đặt phòng.');
              return;
            }

            if (this.selectedPaymentMethod === 'ONLINE_DEPOSIT' || this.selectedPaymentMethod === 'ONLINE_FULL') {
              // Bước 3: Tạo PayOS link và redirect
              this.createPaymentLink(publicCode, holdToken);
            } else {
              // Thanh toán tại khách sạn
              this.isLoading = false;
              this.isProcessingPayment = false;
              this.router.navigate(['/booking-success'], {
                queryParams: {
                  publicCode: publicCode,
                  bookingId: publicCode,
                  paymentMethod: 'AT_HOTEL'
                }
              });
            }
          },
          error: (err) => {
            this.handleError(err.message || 'Lỗi khi xác nhận đơn đặt phòng.');
          }
        });
      },
      error: (err) => {
        this.handleError(err.message || 'Lỗi khi giữ phòng (phòng có thể đã hết trong thời gian này).');
      }
    });
  }

  private createPaymentLink(publicCode: string, holdToken?: string) {
    this.paymentService.createPayOsPaymentLink(publicCode, holdToken).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.isProcessingPayment = false;
        const checkoutUrl = response.data?.checkout_url || response.data?.checkoutUrl;
        if (checkoutUrl) {
          window.location.href = `${checkoutUrl}`;
        } else {
          this.router.navigate(['/booking-success'], {
            queryParams: { publicCode: publicCode, bookingId: publicCode }
          });
        }
      },
      error: (err) => {
        console.warn('Payment link error, navigating to pending:', err);
        this.isLoading = false;
        this.isProcessingPayment = false;
        this.router.navigate(['/booking-success'], {
          queryParams: { 
            publicCode: publicCode,
            bookingId: publicCode,
            status: 'pending'
          }
        });
      }
    });
  }

  private handleError(message: string) {
    this.isLoading = false;
    this.isProcessingPayment = false;
    this.errorMessage = message;
    this.cdr.detectChanges();
  }
}
