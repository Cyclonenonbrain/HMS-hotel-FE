import { Component, OnInit, ElementRef, HostListener, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CheckoutService } from '../../services/checkout.services'; 
import { AuthService } from '../../services/auth.services';
import { Router, RouterModule } from '@angular/router';
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
    price: 450.00, 
    serviceFee: 27.00,
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
    private router: Router,
    private eRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
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
  get taxAmount(): number { return (this.room.price * 3) * 0.08; }
  get totalAmount(): number { return (this.room.price * 3) + this.taxAmount + this.room.serviceFee; }

  onConfirmPayment() {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    this.isLoading = true;
    // ... logic gửi API checkoutService.confirmBooking ...
  }
}