import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // Thêm ChangeDetectorRef ở đây
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { BookingService, ApiResponse } from '../../services/booking.services'; 

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './booking-confirmation.component.html', // Thêm ./
  styleUrls: ['./booking-confirmation.component.css']    // Thêm ./
})
export class BookingConfirmationComponent implements OnInit {
  bookingData: any = null;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private cdr: ChangeDetectorRef // BẮT BUỘC: Inject vào đây để sử dụng
  ) { }

  ngOnInit(): void {
    const bookingId = this.route.snapshot.paramMap.get('id');

    if (bookingId) {
      this.getBookingDetails(bookingId);
    } else {
      this.router.navigate(['/']);
    }
  }

  getBookingDetails(id: string) {
    this.isLoading = true;
    this.bookingService.getBookingById(id).subscribe({
      next: (res: ApiResponse<any>) => {
        if (res.success) {
          this.bookingData = res.data;
        }
        this.isLoading = false;
        // Cập nhật lại giao diện vì data về từ async
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Lỗi khi lấy thông tin booking:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  downloadReceipt() {
    // Nếu sau này bạn dùng thư viện như jspdf
    alert('Hệ thống đang chuẩn bị hóa đơn PDF cho mã: ' + this.bookingData?.id);
  }
}