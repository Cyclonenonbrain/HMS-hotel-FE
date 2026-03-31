import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Quan trọng để dùng ngModel
import { Subscription } from 'rxjs';
import { RoomService } from '../../services/room.services';
import { AuthService } from '../../services/auth.services';
import { VndPipe } from '../../core/vnd.pipe';

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, VndPipe],
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
  private authSub!: Subscription;

  // Form đặt phòng
  bookingForm = {
    checkIn: '',
    checkOut: ''
  };

  // Cấu hình phí cố định
  readonly TAX_RATE = 0.08;

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
    private router: Router
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
        this.room = {
          ...data,
          displayName: this.formatRoomName(data.name),
          displayPrice: parseFloat(data.basePrice || data.base_price || 0),
          description: data.description || "Step into an oasis of calm and luxury. Our suites offer an expansive living space, a private balcony with panoramic sea views, and premium comfort.",
          amenities: this.mapAmenitiesToIcons(data.amenities || []),
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
    this.invoice.finalTotal = this.invoice.roomTotal + this.invoice.taxes;
    
    this.cdr.detectChanges();
  }

  formatRoomName(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('deluxe')) return "Executive Deluxe Room";
    if (lower.includes('std') || lower.includes('standard')) return "Premium Standard Room";
    if (lower.includes('suite')) return "Ocean View Suite";
    return name;
  }

  private mapAmenitiesToIcons(amenities: string[]) {
    const iconMap: Record<string, { icon: string; label: string }> = {
      TV: { icon: 'tv', label: 'TV' },
      BATHTUB: { icon: 'bathtub', label: 'Bathtub' },
      BALCONY: { icon: 'balcony', label: 'Balcony' },
      KITCHEN: { icon: 'kitchen', label: 'Kitchen' },
      SOFA: { icon: 'weekend', label: 'Sofa' },
      PRIVATE_POOL: { icon: 'pool', label: 'Private Pool' },
      WIFI: { icon: 'wifi', label: 'WiFi' },
      AC: { icon: 'ac_unit', label: 'AC' }
    };

    return amenities.map((name) => {
      const normalized = String(name || '').toUpperCase().replace(/\s+/g, '_');
      return iconMap[normalized] || { icon: 'check_circle', label: name };
    });
  }

  onReserve() {
    if (!this.room) {
      return;
    }

    this.router.navigate(['/checkout'], {
      queryParams: {
        roomId: this.room.id,
        roomName: this.room.displayName || this.room.name,
        roomType: this.room.name || this.room.displayName,
        checkIn: this.bookingForm.checkIn,
        checkOut: this.bookingForm.checkOut,
        guests: this.room.capacity || 1,
        price: this.room.displayPrice
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
