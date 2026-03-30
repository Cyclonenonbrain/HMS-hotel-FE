import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { VndPipe } from '../../core/vnd.pipe';
import { AuthService } from '../../services/auth.services';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule, VndPipe],
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.css']
})
export class MyBookingsComponent implements OnInit {
  user: any = null;
  isLoggedIn: boolean = false;

  activeTab: 'upcoming' | 'completed' | 'cancelled' = 'upcoming';

  // Mock data — sẽ thay bằng BookingService.getBookings() khi backend sẵn sàng
  bookings = [
    {
      id: 'BKG-10294',
      roomName: 'Executive Ocean View Suite',
      checkIn: '2026-04-15',
      checkOut: '2026-04-18',
      guests: 2,
      totalPrice: 4500000,
      status: 'confirmed',
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      type: 'upcoming'
    },
    {
      id: 'BKG-09382',
      roomName: 'Premium Family Room',
      checkIn: '2026-05-02',
      checkOut: '2026-05-05',
      guests: 4,
      totalPrice: 6200000,
      status: 'pending',
      image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
      type: 'upcoming'
    },
    {
      id: 'BKG-08112',
      roomName: 'Standard Double Room',
      checkIn: '2026-01-10',
      checkOut: '2026-01-12',
      guests: 2,
      totalPrice: 1200000,
      status: 'completed',
      image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80',
      type: 'completed'
    },
    {
      id: 'BKG-07441',
      roomName: 'Presidential Suite',
      checkIn: '2025-11-20',
      checkOut: '2025-11-25',
      guests: 2,
      totalPrice: 25000000,
      status: 'cancelled',
      image: 'https://images.unsplash.com/photo-1582719478250-c89af14bcfcb?auto=format&fit=crop&w=800&q=80',
      type: 'cancelled'
    }
  ];

  constructor(
    private authService: AuthService,
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
      } else {
        this.user = null;
        this.router.navigate(['/login']);
      }
      this.cdr.detectChanges();
    });
  }

  get filteredBookings() {
    return this.bookings.filter(b => b.type === this.activeTab);
  }

  setTab(tab: 'upcoming' | 'completed' | 'cancelled') {
    this.activeTab = tab;
  }

  onLogout() {
    this.authService.logout();
    this.cdr.detectChanges();
  }
}
