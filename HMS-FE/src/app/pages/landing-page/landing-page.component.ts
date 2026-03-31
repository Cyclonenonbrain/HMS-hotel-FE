import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.services';
import { FeaturedRoomService, FeaturedRoomType } from '../../services/featured-room.service';
import { VndPipe } from '../../core/vnd.pipe';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, VndPipe],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
  isLoggedIn: boolean = false;
  user: any = null;
  featuredRooms: any[] = [];
  isLoadingFeatured: boolean = false;

  // Search form state
  searchCheckIn: string = this.getToday();
  searchCheckOut: string = this.getTomorrow();
  searchGuests: number = 2;
  minDate: string = this.getToday();

  constructor(
    private authService: AuthService,
    private featuredRoomService: FeaturedRoomService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

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
      }
      this.cdr.detectChanges();
    });

    this.loadFeaturedRooms();
  }

  // --- DATE HELPERS ---
  getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  getTomorrow(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  // --- SEARCH FUNCTIONALITY ---
  onSearch(): void {
    // Validate dates
    if (this.searchCheckOut <= this.searchCheckIn) {
      const nextDay = new Date(this.searchCheckIn);
      nextDay.setDate(nextDay.getDate() + 1);
      this.searchCheckOut = nextDay.toISOString().split('T')[0];
    }

    // Navigate to /search with query params
    this.router.navigate(['/search'], {
      queryParams: {
        checkIn: this.searchCheckIn,
        checkOut: this.searchCheckOut,
        guests: this.searchGuests
      }
    });
  }

  onCheckInChange(): void {
    // Ensure check-out is after check-in
    if (this.searchCheckOut <= this.searchCheckIn) {
      const nextDay = new Date(this.searchCheckIn);
      nextDay.setDate(nextDay.getDate() + 1);
      this.searchCheckOut = nextDay.toISOString().split('T')[0];
    }
  }

  // --- FEATURED ROOMS ---
  loadFeaturedRooms(): void {
    this.isLoadingFeatured = true;
    this.featuredRoomService.getFeaturedRoomTypes().subscribe({
      next: (rooms: FeaturedRoomType[]) => {
        this.featuredRooms = rooms.map((room: FeaturedRoomType) => ({
          id: room.room_type_id,
          title: room.name,
          price: room.price_per_night,
          rating: room.rating,
          desc: this.getDescriptionByName(room.name),
          features: this.mapAmenitiesToIcons(room.amenities),
          image: room.thumbnail_url || this.getImageByRoomName(room.name)
        }));
        this.isLoadingFeatured = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi khi tải Featured Room Types:', err);
        this.isLoadingFeatured = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Map amenities to Material Icons
  mapAmenitiesToIcons(amenities: string[]): string[] {
    const iconMap: { [key: string]: string } = {
      'wifi': 'wifi',
      'WiFi': 'wifi',
      'king_bed': 'king_bed',
      'King Bed': 'king_bed',
      'queen_bed': 'bed',
      'Queen Bed': 'bed',
      'balcony': 'balcony',
      'Balcony': 'balcony',
      'ocean_view': 'water',
      'Ocean View': 'water',
      'tv': 'tv',
      'TV': 'tv',
      'ac': 'ac_unit',
      'AC': 'ac_unit',
      'pool': 'pool',
      'Pool': 'pool',
      'local_bar': 'local_bar'
    };

    return amenities
      .map(a => iconMap[a] || 'check_circle')
      .slice(0, 4); // Max 4 icons
  }

  getImageByRoomName(name: string): string {
    const n = name ? name.toLowerCase() : '';
    if (n.includes('suite')) return 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000';
    if (n.includes('deluxe')) return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1000';
    if (n.includes('family')) return 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1000';
    return 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1000';
  }

  getDescriptionByName(name: string): string {
    const n = name ? name.toLowerCase() : '';
    if (n.includes('suite')) return 'Phòng suite cao cấp với không gian rộng rãi và tiện nghi đẳng cấp 5 sao.';
    if (n.includes('deluxe')) return 'Trải nghiệm không gian sang trọng với đầy đủ tiện nghi cao cấp.';
    if (n.includes('family')) return 'Phòng gia đình rộng rãi, phù hợp cho kỳ nghỉ cùng người thân.';
    return 'Phòng nghỉ tiện nghi với thiết kế hiện đại và view đẹp.';
  }

  logout() {
    this.authService.logout();
    this.cdr.detectChanges();
  }
}
