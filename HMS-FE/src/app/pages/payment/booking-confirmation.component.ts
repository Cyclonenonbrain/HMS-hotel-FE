import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { BookingService, ApiResponse } from '../../services/booking.services';
import { VndPipe } from '../../core/vnd.pipe';


@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule, VndPipe],
  templateUrl: './booking-confirmation.component.html',
  styleUrls: ['./booking-confirmation.component.css']
})
export class BookingConfirmationComponent implements OnInit {
  bookingData: any = null;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // First, try to get data from navigation state (passed from checkout)
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const state = navigation.extras.state as any;
      if (state['bookingData']) {
        this.bookingData = state['bookingData'];
        this.isLoading = false;
        this.cdr.detectChanges();
        return;
      }
    }

    // Otherwise, try to get from query params
    this.route.queryParamMap.subscribe(params => {
      const bookingDataStr = params.get('bookingData');
      if (bookingDataStr) {
        try {
          this.bookingData = JSON.parse(bookingDataStr);
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        } catch (e) {
          console.error('Error parsing booking data:', e);
        }
      }

      // Finally, try to fetch from API using route param id
      const bookingId = this.route.snapshot.paramMap.get('id');
      if (bookingId) {
        this.getBookingDetails(bookingId);
      } else {
        this.isLoading = false;
        this.router.navigate(['/']);
      }
    });
  }

  getBookingDetails(id: string) {
    this.isLoading = true;
    this.bookingService.getBookingById(id).subscribe({
      next: (res: ApiResponse<any>) => {
        if (res.success) {
          this.bookingData = res.data;
        }
        this.isLoading = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Error fetching booking details:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  downloadReceipt() {
    alert('System is preparing PDF receipt for booking: ' + this.bookingData?.bookingCode);
  }
}