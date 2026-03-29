import { Component, OnInit, ChangeDetectorRef, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Quan trọng để dùng ngModel
import { Subscription } from 'rxjs';
import { RoomService } from '../../services/room.services';
import { AuthService } from '../../services/auth.services';

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './room-details.component.html',
  styleUrls: ['./room-details.component.css']
})
export class RoomDetailComponent implements OnInit, OnDestroy {
  // Trạng thái dữ liệu
  room: any = null;
  loading: boolean = true;

  // Trạng thái User
  isLoggedIn: boolean = false;
  user: any = null;
  isProfileMenuOpen: boolean = false;
  private authSub!: Subscription;

  // Form đặt phòng
  bookingForm = {
    checkIn: '',
    checkOut: '',
    guests: 2
  };

  // Cấu hình phí cố định
  readonly CLEANING_FEE = 2125000; // 2,125,000 VND
  readonly SERVICE_FEE = 3000000; // 3,000,000 VND
  readonly TAX_RATE = 0.1;

  // Kết quả tính toán hóa đơn
  invoice = {
    nights: 0,
    roomTotal: 0,
    taxes: 0,
    finalTotal: 0
  };

  mockGallery = [
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1000',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1000',
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1000'
  ];

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private eRef: ElementRef
  ) { }

  ngOnInit(): void {
    // 1. Khởi tạo ngày mặc định (Hôm nay và 4 ngày sau)
    this.initDefaultDates();

    // 2. Đồng bộ User
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
          } catch (e) { console.error(e); }
        }
      } else {
        this.user = null;
      }
      this.cdr.detectChanges();
    });

    // 3. Tải chi tiết phòng
    const roomId = this.route.snapshot.paramMap.get('id');
    if (roomId) this.loadRoomDetail(roomId);
  }

  ngOnDestroy(): void {
    if (this.authSub) this.authSub.unsubscribe();
  }

  // Thêm tham số event để xử lý chủ động
  toggleProfileMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  
    this.cdr.detectChanges();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
   
    const isClickInside = target.closest('.profile-area');

    if (!isClickInside && this.isProfileMenuOpen) {
      this.isProfileMenuOpen = false;
      this.cdr.detectChanges();
    }
  }

  private initDefaultDates() {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 4);

    this.bookingForm.checkIn = today.toISOString().split('T')[0];
    this.bookingForm.checkOut = future.toISOString().split('T')[0];
  }

  loadRoomDetail(id: string) {
    this.loading = true;
    this.roomService.getRoomById(id).subscribe({
      next: (res: any) => {
        const data = res.data;
        const computedPrice = this.roomService.getDisplayPrice(data.name, parseFloat(data.basePrice || data.base_price || 0));
        this.room = {
          ...data,
          displayName: this.formatRoomName(data.name),
          displayPrice: computedPrice,
          category: this.getRoomTierByPrice(computedPrice),
          description: data.description || "Step into an oasis of calm and luxury. Our suites offer an expansive living space, a private balcony with panoramic sea views, and premium comfort.",
          amenities: this.getAmenitiesByRoom(data.name),
          images: this.mockGallery
        };
        this.updateInvoice();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Lỗi:", err);
        this.loading = false;
      }
    });
  }

  getRoomTierByPrice(price: number): string {
    if (price >= 100000000) return 'Presidential Suite';
    if (price >= 20000000) return 'Specialty/Signature Suite';
    if (price >= 9000000) return 'Suite';
    if (price >= 5500000) return 'Grand Deluxe/Executive';
    if (price >= 3500000) return 'Deluxe/Superior';
    return 'Premium Comfort';
  }

  convertToLuxuryPrice(basePrice: number): number {
    let vndPrice = Number.isFinite(basePrice) ? basePrice : 0;
    if (vndPrice > 0 && vndPrice < 2000) {
      vndPrice = Math.round(vndPrice * 25000);
    }
    if (vndPrice < 3500000) {
      vndPrice = 3500000;
    }
    if (vndPrice < 5500000) {
      return vndPrice; // Deluxe/Superior
    }
    if (vndPrice < 9000000) {
      return Math.max(vndPrice, 5500000); // Grand Deluxe
    }
    if (vndPrice < 15000000) {
      return Math.max(vndPrice, 9000000); // Suite
    }
    if (vndPrice < 20000000) {
      return 20000000; // Specialty Suite
    }
    if (vndPrice < 50000000) {
      return Math.max(vndPrice, 20000000);
    }
    if (vndPrice < 100000000) {
      return 50000000; // segment high-end
    }
    return Math.max(vndPrice, 100000000);
  }

  updateInvoice() {
    if (!this.room) return;

    const start = new Date(this.bookingForm.checkIn);
    const end = new Date(this.bookingForm.checkOut);

    // Tính số đêm
    const diffTime = end.getTime() - start.getTime();
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Validation ngày hợp lệ
    if (diffDays <= 0) {
      diffDays = 1;
      const newOut = new Date(start);
      newOut.setDate(start.getDate() + 1);
      this.bookingForm.checkOut = newOut.toISOString().split('T')[0];
    }

    this.invoice.nights = diffDays;
    this.invoice.roomTotal = this.room.displayPrice * diffDays;
    this.invoice.taxes = Math.round(this.invoice.roomTotal * this.TAX_RATE);
    this.invoice.finalTotal = this.invoice.roomTotal + this.CLEANING_FEE + this.SERVICE_FEE + this.invoice.taxes;

    this.cdr.detectChanges();
  }

  formatRoomName(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('deluxe')) return "Executive Deluxe Room";
    if (lower.includes('std') || lower.includes('standard')) return "Premium Standard Room";
    if (lower.includes('suite')) return "Ocean View Suite";
    return name;
  }

  getAmenitiesByRoom(name: string) {
    const common = [
      { icon: 'wifi', label: 'Free Wi-Fi' },
      { icon: 'tv', label: '65" Smart TV' },
      { icon: 'coffee_maker', label: 'Espresso Machine' },
      { icon: 'room_service', label: '24/7 Service' }
    ];
    if (name.toLowerCase().includes('deluxe') || name.toLowerCase().includes('suite')) {
      return [
        { icon: 'king_bed', label: 'King Bed' },
        { icon: 'waves', label: 'Sea View' },
        { icon: 'deck', label: 'Balcony' },
        { icon: 'bathtub', label: 'Deep Soaking Tub' },
        ...common
      ];
    }
    return [{ icon: 'bed', label: 'Queen Bed' }, ...common];
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}