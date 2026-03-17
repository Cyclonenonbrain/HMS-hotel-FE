import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CheckoutService } from '../../services/checkout.services'; 
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  user: any = null;
  isProfileMenuOpen = false;
  isLoading = false;
  selectedCardIndex = 0;

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
    private router: Router,
    private eRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData() {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
      // Đảm bảo có field role để hiển thị giao diện
      if (!this.user.role) this.user.role = 'Premium';
      
      this.bookingData.fullName = this.user.fullName || '';
      this.bookingData.email = this.user.email || '';
      this.bookingData.phone = this.user.phone || '';
    }
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    // Nếu click ra ngoài dropdown và nút avatar, đóng menu
    const clickedInside = this.eRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.isProfileMenuOpen = false;
    }
  }

  onLogout() {
    localStorage.removeItem('user');
    this.user = null;
    this.isProfileMenuOpen = false;
    this.router.navigate(['/login']);
  }

  get taxAmount(): number {
    return (this.room.price * 3) * 0.08;
  }

  get totalAmount(): number {
    return (this.room.price * 3) + this.taxAmount + this.room.serviceFee;
  }

  onConfirmPayment() {
    if (!this.user) {
      alert('Please login to complete booking');
      return;
    }

    this.isLoading = true;
    const payload = {
      userId: this.user.id,
      roomId: this.room.id,
      checkIn: this.bookingData.checkIn,
      checkOut: this.bookingData.checkOut,
      numberOfGuests: this.bookingData.numberOfGuests,
      stayType: this.bookingData.stayType,
      snapshotRoomPrice: this.room.price,
      paymentMethod: this.cards[this.selectedCardIndex].type,
      amount: this.totalAmount
    };

    this.checkoutService.confirmBooking(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.router.navigate(['/checkout/confirmation'], { queryParams: { id: res.data.id } });
      },
      error: (err) => {
        this.isLoading = false;
        alert('Payment failed: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }
}