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

  cards = [
    { id: 1, type: 'VISA', lastFour: '4242', expiry: '12/25' },
    { id: 2, type: 'MASTERCARD', lastFour: '8899', expiry: '08/26' }
  ];

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

  get taxAmount(): number {
    return Math.round((this.room.price * this.nights) * 0.08);
  }

  get totalAmount(): number {
    return (this.room.price * this.nights) + this.taxAmount + this.room.serviceFee;
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

  // Logic tính toán
  onConfirmPayment() {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    this.isLoading = true;
    // ... logic gửi API checkoutService.confirmBooking ...
  }
}