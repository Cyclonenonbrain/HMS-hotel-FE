import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RoomService } from '../../services/room.services';
import { AuthService } from '../../services/auth.services';

@Component({
    selector: 'app-room-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: 'search&filter.component.html',
    styleUrls: ['search&filter.component.css']
})
export class RoomListComponent implements OnInit {
    allRooms: any[] = [];      // Danh sách gốc từ API
    filteredRooms: any[] = []; // Danh sách hiển thị sau khi lọc
    isLoggedIn: boolean = false;
    user: any = null;
    selectedSort: string = 'recommended';

    // --- PHẦN QUẢN LÝ FILTER ---
    filters = {
        searchQuery: '',
        priceRange: 1000000,
        amenities: {
            oceanView: false,
            privateBalcony: false,
            kingBed: false
        }
    };

    constructor(
        private roomService: RoomService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.authService.isLoggedIn$.subscribe(status => {
            this.isLoggedIn = status;
            if (status) {
                const userData = localStorage.getItem('currentUser');
                this.user = userData ? JSON.parse(userData) : null;
            }
            this.cdr.detectChanges();
        });
        this.loadRooms();
    }

    // Logic lọc chính
    applyFilters() {
        console.log('Đang lọc với:', this.filters);

        this.filteredRooms = this.allRooms.filter(room => {
            // 1. Lọc theo giá (Lưu ý: database của bạn có giá Standard là 500,000 - cần check đơn vị)
            // Nếu Slider là $2000 nhưng giá DB là 500k, phòng sẽ mất. Ở đây giả định giá đã chuẩn hóa.
            const isSliderAtMax = this.filters.priceRange >= 1000000;
            const matchPrice = isSliderAtMax ? true : room.displayPrice <= this.filters.priceRange;

            // 2. Lọc theo từ khóa (Search)
            const matchSearch = !this.filters.searchQuery ||
                room.displayName.toLowerCase().includes(this.filters.searchQuery.toLowerCase()) ||
                room.displayDesc.toLowerCase().includes(this.filters.searchQuery.toLowerCase());

            // 3. Lọc theo Amenities (Nếu checkbox được tick, phòng phải chứa icon tương ứng)
            let matchAmenities = true;
            if (this.filters.amenities.oceanView) {
                matchAmenities = matchAmenities && room.icons.some((i: any) => i.label === 'Ocean View');
            }
            if (this.filters.amenities.kingBed) {
                matchAmenities = matchAmenities && room.icons.some((i: any) => i.label === 'King Bed');
            }
            if (this.filters.amenities.privateBalcony) {
                matchAmenities = matchAmenities && room.icons.some((i: any) => i.label === 'Balcony');
            }

            return matchPrice && matchSearch && matchAmenities;
        });
        this.applySort(); // Áp dụng sắp xếp sau khi lọc
        this.cdr.detectChanges();
    }

    clearAllFilters() {
        this.filters = {
            searchQuery: '',
            priceRange: 1000000,
            amenities: {
                oceanView: false,
                privateBalcony: false,
                kingBed: false
            }
        };
        this.applyFilters();
    }
    applySort() {
        switch (this.selectedSort) {
            case 'low-to-high':
                this.filteredRooms.sort((a, b) => a.displayPrice - b.displayPrice);
                break;
            case 'high-to-high':
                this.filteredRooms.sort((a, b) => b.displayPrice - a.displayPrice);
                break;
            default:
                // Sắp xếp theo "Recommended" hoặc mặc định theo ID/Ngày tạo
                // Ở đây ta dùng ID để giữ thứ tự ổn định
                this.filteredRooms.sort((a, b) => a.id.localeCompare(b.id));
                break;
        }
        this.cdr.detectChanges();
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    loadRooms() {
        this.roomService.getAllRooms().subscribe({
            next: (response: any) => {
                const roomArray = response.data || [];
                this.allRooms = roomArray.map((room: any) => {
                    let finalName = room.name;
                    const lowerName = room.name.toLowerCase();

                    // Làm đẹp tên phòng từ DB
                    if (lowerName.includes('bookingdeluxe')) {
                        finalName = "Executive Deluxe Room";
                    } else if (lowerName.includes('bookingstd') || lowerName.includes('p2-deluxe')) {
                        finalName = "Premium Standard Room";
                    } else if (lowerName.includes('single')) {
                        finalName = "Single Cozy Room";
                    }

                    return {
                        ...room,
                        displayName: finalName,
                        displayPrice: parseFloat(room.base_price), // Chuyển về số để lọc
                        displayDesc: room.description || "Experience unparalleled luxury with panoramic views and premium amenities.",
                        image: this.getImageByRoomName(room.name),
                        icons: this.getIconsByRoomName(room.name)
                    };
                });

                // Khởi tạo danh sách hiển thị ban đầu
                this.filteredRooms = [...this.allRooms];
                this.cdr.detectChanges();
            },
            error: (err) => console.error("Lỗi khi load phòng:", err)
        });
    }

    getImageByRoomName(name: string): string {
        const n = name.toLowerCase();
        if (n.includes('deluxe')) return 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000';
        if (n.includes('suite')) return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1000';
        if (n.includes('std') || n.includes('standard')) return 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1000';
        return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000';
    }

    getIconsByRoomName(name: string): any[] {
        const n = name.toLowerCase();
        // Gán Icon dựa trên loại phòng để filter Amenities hoạt động
        if (n.includes('deluxe') || n.includes('executive')) {
            return [
                { icon: 'king_bed', label: 'King Bed' },
                { icon: 'water', label: 'Ocean View' },
                { icon: 'balcony', label: 'Balcony' },
                { icon: 'wifi', label: 'Free WiFi' }
            ];
        }
        return [
            { icon: 'bed', label: 'Queen Bed' },
            { icon: 'wifi', label: 'Free WiFi' }
        ];
    }
}