import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RoomService } from '../../services/room.services';

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: 'room-details.component.html',
  styleUrls: ['room-details.component.css']
})
export class RoomDetailComponent implements OnInit {
  room: any = null;
  loading: boolean = true;
  
  // Mock data cho Gallery và Amenities vì Backend hiện chưa trả về các trường này
  mockGallery = [
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1000',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1000',
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1000'
  ];

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService
  ) {}

  ngOnInit(): void {
    // Lấy ID từ URL
    const roomId = this.route.snapshot.paramMap.get('id');
    if (roomId) {
      this.loadRoomDetail(roomId);
    }
  }

  loadRoomDetail(id: string) {
    this.loading = true;
    // Giả sử service của bạn có hàm getRoomById
    this.roomService.getRoomById(id).subscribe({
      next: (res: any) => {
        const data = res.data;
        // Map dữ liệu từ Backend và gán thêm thông tin mock
        this.room = {
          ...data,
          displayName: this.formatRoomName(data.name),
          displayPrice: data.basePrice || data.base_price || 0,
          description: data.description || "Step into an oasis of calm and luxury. Experience premium comfort with our top-tier facilities.",
          amenities: this.getAmenitiesByRoom(data.name),
          images: this.mockGallery // Tạm thời dùng mock gallery
        };
        this.loading = false;
      },
      error: (err) => {
        console.error("Lỗi khi tải chi tiết phòng:", err);
        this.loading = false;
      }
    });
  }

  // Logic map tên chuyên nghiệp (tái sử dụng từ search component)
  formatRoomName(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('deluxe')) return "Executive Deluxe Room";
    if (lower.includes('std') || lower.includes('standard')) return "Premium Standard Room";
    return name;
  }

  // Logic map Amenities dựa trên loại phòng (tương tự search component)
  getAmenitiesByRoom(name: string) {
    const n = name.toLowerCase();
    const common = [
        { icon: 'wifi', label: 'Free Wi-Fi' },
        { icon: 'tv', label: '65" Smart TV' },
        { icon: 'room_service', label: '24/7 Service' }
    ];

    if (n.includes('deluxe')) {
      return [
        { icon: 'king_bed', label: 'King Bed' },
        { icon: 'waves', label: 'Sea View' },
        { icon: 'deck', label: 'Balcony' },
        ...common
      ];
    }
    return [
        { icon: 'bed', label: 'Queen Bed' },
        ...common
    ];
  }
}