import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.services';
import { RoomService } from '../../services/room.services';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
  isLoggedIn: boolean = false;
  user: any = null;
  rooms: any[] = [];

  constructor(
    private authService: AuthService,
    private roomService: RoomService,
    private cdr: ChangeDetectorRef // Thêm để ép cập nhật giao diện
  ) { }

  ngOnInit(): void {
    // Theo dõi trạng thái đăng nhập
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
      if (status) {
        const userData = localStorage.getItem('currentUser');
        this.user = userData ? JSON.parse(userData) : null;

        // CHỈ gọi lấy phòng khi đã xác nhận đăng nhập thành công
        this.loadRoomsFromDB();
      } else {
        this.user = null;
        this.rooms = []; // Xóa dữ liệu phòng khi đăng xuất
      }
      this.cdr.detectChanges();
    });
  }

  loadRoomsFromDB() {
    this.roomService.getAllRooms().subscribe({
      next: (response: any) => {
        console.log('Dữ liệu thô nhận từ API:', response);

        // Quan trọng: Truy cập vào response.data vì API của bạn bọc mảng trong đó
        const roomArray = response.data || [];

        if (roomArray.length > 0) {
          this.rooms = roomArray.map((room: any) => ({
            ...room,
            title: room.name,
            price: room.base_price,
            desc: room.description,
            features: this.getMockFeatures(room.name),
            image: this.getHardcodedImage(room.name)
          }));
          this.cdr.detectChanges();
          console.log('Mảng rooms sau khi map thành công:', this.rooms);
        }
      },
      error: (err) => {
        console.error('Lỗi kết nối Backend:', err);
      }
    });
  }

  getHardcodedImage(name: string): string {
    const n = name ? name.toLowerCase() : '';
    if (n.includes('suite')) return 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000';
    if (n.includes('deluxe')) return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1000';
    if (n.includes('family')) return 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1000';
    return 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1000';
  }

  getMockFeatures(name: string): string[] {
    const n = name ? name.toLowerCase() : '';
    if (n.includes('suite')) return ['pool', 'wifi', 'ac', 'local_bar'];
    return ['wifi', 'bed', 'tv'];
  }

  logout() {
    this.authService.logout();
    this.rooms = [];
  }
}