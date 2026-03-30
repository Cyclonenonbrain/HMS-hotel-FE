import { Component, OnInit, ElementRef, HostListener, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CheckoutService } from '../../services/checkout.services'; 
import { AuthService } from '../../services/auth.services';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { VndPipe } from '../../core/vnd.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule, VndPipe],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  user: any = null;
  isLoggedIn: boolean = false; // Thêm biến này để đồng bộ logic
  isProfileMenuOpen = false;
  isLoading = false;
  selectedCardIndex = 0;
  private authSub!: Subscription;

  // Mock dữ liệu phòng (Bạn có thể lấy từ ActivatedRoute nếu cần)
  room = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Executive Suite',
    type: 'Premium Suite',
    price: 450.00,
    serviceFee: 270000.00,
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
  };

  bookingData = {
    fullName: '',
    email: '',
    phone: '',
    checkIn: '2026-03-15',
    checkOut: '2026-03-18',
    numberOfGuests: 2,
    stayType: 'daily'
  };

  paymentMethods = ['VISA', 'MASTERCARD'];
  selectedMethod: string | null = null;

  paymentForms: Record<string, {
    cardNumber: string;
    cardHolder: string;
    expiry: string;
    cvv: string;
  }> = {
    VISA: { cardNumber: '', cardHolder: '', expiry: '', cvv: '' },
    MASTERCARD: { cardNumber: '', cardHolder: '', expiry: '', cvv: '' }
  };

  savedPaymentInfo: Record<string, {
    cardNumber: string;
    cardHolder: string;
    expiry: string;
  } | null> = {
    VISA: null,
    MASTERCARD: null
  };

  // Discount / coupon state
  discountEnabled = false;
  availableCoupons: Array<{ code: string; description: string; type: 'amount' | 'percent'; value: number }> = [];
  selectedCouponCode: string | null = null;

  // Validation error messages
  validationErrors = {
    fullName: '',
    email: '',
    phone: '',
    card: ''
  };

  constructor(
    private checkoutService: CheckoutService, 
    private authService: AuthService, // Inject AuthService
    private route: ActivatedRoute,
    private router: Router,
    private eRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.readQueryParams();
    this.detectAvailableCoupons();

    // ĐỒNG BỘ LOGIC: Theo dõi trạng thái đăng nhập y hệt LandingPage/RoomList
    this.authSub = this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
      if (status) {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            // Map dữ liệu chuẩn hóa giống RoomList
            this.user = {
              ...parsedUser,
              fullName: parsedUser.full_name || parsedUser.fullName || 'Guest Member'
            };
            
            // Tự động điền form
            this.bookingData.fullName = this.user.fullName;
            this.bookingData.email = this.user.email || '';
          } catch (e) {
            console.error("Lỗi parse User tại Checkout:", e);
          }
        }
      } else {
        this.user = null;
        this.router.navigate(['/login']); // Chưa login thì đẩy ra
      }
      this.cdr.detectChanges();
    });
  }

  private readQueryParams() {
    this.route.queryParamMap.subscribe(params => {
      const roomId = params.get('roomId');
      const roomName = params.get('roomName');
      const roomType = params.get('roomType');
      const price = Number(params.get('price'));
      const checkIn = params.get('checkIn');
      const checkOut = params.get('checkOut');
      const guests = Number(params.get('guests'));

      if (roomId) this.room.id = roomId;
      if (roomName) this.room.name = roomName;
      if (roomType) this.room.type = roomType;
      if (!isNaN(price) && price > 0) this.room.price = price;
      if (checkIn) this.bookingData.checkIn = checkIn;
      if (checkOut) this.bookingData.checkOut = checkOut;
      if (!isNaN(guests) && guests > 0) this.bookingData.numberOfGuests = guests;

      // Nếu chưa có giá dịch vụ từ query thì giữ giá mặc định
      this.cdr.detectChanges();
    });
  }

  get nights(): number {
    const start = new Date(this.bookingData.checkIn);
    const end = new Date(this.bookingData.checkOut);
    const diff = end.getTime() - start.getTime();
    const days = Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 1);
    return days;
  }

  detectAvailableCoupons() {
    // Mock behavior: auto-detect coupons for current user/room.
    // Replace with API call to backend endpoint (e.g., /api/coupons/available) when ready.
    this.availableCoupons = [
      { code: 'HMS10', description: '10% off for loyalty', type: 'percent', value: 10 },
      { code: 'HMS50K', description: '50,000₫ off', type: 'amount', value: 50000 }
    ];
  }

  get discountAmount(): number {
    if (!this.discountEnabled || !this.selectedCouponCode) {
      return 0;
    }

    const coupon = this.availableCoupons.find(c => c.code === this.selectedCouponCode);
    if (!coupon) {
      return 0;
    }

    if (coupon.type === 'percent') {
      return Math.round((this.room.price * this.nights) * (coupon.value / 100));
    }

    return coupon.value;
  }

  get taxAmount(): number {
    const baseAmount = this.room.price * this.nights;
    const afterDiscount = Math.max(baseAmount - this.discountAmount, 0);
    return Math.round(afterDiscount * 0.08);
  }

  get totalAmount(): number {
    const baseAmount = this.room.price * this.nights;
    const discounted = Math.max(baseAmount - this.discountAmount, 0);
    return discounted + this.taxAmount + this.room.serviceFee;
  }

  ngOnDestroy(): void {
    if (this.authSub) this.authSub.unsubscribe();
  }

  // Các hàm xử lý giao diện
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

  confirmPaymentMethod(method: string) {
    const form = this.paymentForms[method];
    if (!form.cardHolder || !form.cardNumber || !form.expiry || !form.cvv) {
      this.validationErrors.card = 'Please fill all payment fields for ' + method;
      return;
    }
    this.savedPaymentInfo[method] = {
      cardHolder: form.cardHolder,
      cardNumber: form.cardNumber,
      expiry: form.expiry
    };
    this.selectedMethod = null;
    this.validationErrors.card = '';
  }

  // Logic tính toán
  onConfirmPayment() {
    // Reset validation errors
    this.validationErrors = {
      fullName: '',
      email: '',
      phone: '',
      card: ''
    };

    let hasErrors = false;

    // Validate required fields
    if (!this.bookingData.fullName || this.bookingData.fullName.trim() === '') {
      this.validationErrors.fullName = 'Please enter your Full Name';
      hasErrors = true;
    }

    if (!this.bookingData.phone || this.bookingData.phone.trim() === '') {
      this.validationErrors.phone = 'Please enter your Phone Number';
      hasErrors = true;
    }

    if (!this.bookingData.email || this.bookingData.email.trim() === '') {
      this.validationErrors.email = 'Please enter your Email';
      hasErrors = true;
    }

    // Ensure at least one payment was confirmed
    const usableMethod = this.paymentMethods.find(m => !!this.savedPaymentInfo[m]);
    if (!usableMethod) {
      this.validationErrors.card = 'Please confirm a payment method first';
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    this.isLoading = true;

    // Generate booking code (format: HMS-YYYYMMDD-XXXXX)
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 90000) + 10000;
    const bookingCode = `HMS-${dateStr}-${randomNum}`;

    // Prepare booking summary data to pass to confirmation page
    const bookingSummary: any = {
      id: bookingCode,
      bookingCode: bookingCode,
      fullName: this.bookingData.fullName,
      email: this.bookingData.email,
      phone: this.bookingData.phone,
      roomName: this.room.name,
      roomType: this.room.type,
      checkIn: this.bookingData.checkIn,
      checkOut: this.bookingData.checkOut,
      numberOfGuests: this.bookingData.numberOfGuests,
      roomPrice: this.room.price,
      nights: this.nights,
      roomTotal: this.room.price * this.nights,
      taxAmount: this.taxAmount,
      serviceFee: this.room.serviceFee,
      totalPrice: this.totalAmount
    };

    // include selected payment info in booking summary
    const selectedMethod = this.paymentMethods.find(m => !!this.savedPaymentInfo[m]);
    if (selectedMethod && this.savedPaymentInfo[selectedMethod]) {
      bookingSummary.paymentMethod = selectedMethod;
      bookingSummary.paymentInfo = this.savedPaymentInfo[selectedMethod];
    }

    // Navigate to confirmation page with all data in queryParams
    this.router.navigate(['/booking-confirmation', bookingCode], {
      queryParams: {
        bookingData: JSON.stringify(bookingSummary)
      },
      state: { bookingData: bookingSummary }
    }).finally(() => {
      this.isLoading = false;
    });
  }
}