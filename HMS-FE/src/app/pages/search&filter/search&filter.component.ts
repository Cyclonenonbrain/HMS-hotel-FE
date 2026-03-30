import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RoomService } from '../../services/room.services';
import { AuthService } from '../../services/auth.services';
import { VndPipe } from '../../core/vnd.pipe';

@Component({
    selector: 'app-room-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, VndPipe],
    templateUrl: 'search&filter.component.html',
    styleUrls: ['search&filter.component.css']
})
export class RoomListComponent implements OnInit, OnDestroy {
    allRooms: any[] = [];      // Danh sách gốc từ API
    filteredRooms: any[] = []; // Danh sách hiển thị sau khi lọc
    isLoggedIn: boolean = false;
    user: any = null;
    selectedSort: string = 'recommended';
    private authSub!: Subscription;

    // --- PHẦN QUẢN LÝ FILTER ---
    filters = {
        searchQuery: '',
        priceRange: 100000000,
        guests: 2,
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
        // 1. Theo dõi trạng thái đăng nhập và đồng bộ thông tin User
        this.authSub = this.authService.isLoggedIn$.subscribe(status => {
            this.isLoggedIn = status;
            if (status) {
                const userData = localStorage.getItem('currentUser');
                if (userData) {
                    try {
                        const parsedUser = JSON.parse(userData);
                        // Fix lỗi hiển thị null: Ưu tiên lấy full_name từ Backend trả về
                        this.user = {
                            ...parsedUser,
                            fullName: parsedUser.full_name || parsedUser.fullName || 'Guest Member'
                        };
                    } catch (e) {
                        console.error("Lỗi khi parse dữ liệu User:", e);
                    }
                }
            } else {
                this.user = null;
            }
            this.cdr.detectChanges();
        });

        // 2. Tải danh sách phòng
        this.loadRooms();
    }

    ngOnDestroy(): void {
        if (this.authSub) this.authSub.unsubscribe();
    }

    // --- LOGIC LỌC PHÒNG ---
    applyFilters() {
        this.filteredRooms = this.allRooms.filter(room => {
            // Lọc theo giá: Nếu thanh trượt ở mức Max (100,000,000) thì coi như không lọc giá
            const isSliderAtMax = this.filters.priceRange >= 100000000;
            const matchPrice = isSliderAtMax ? true : room.displayPrice <= this.filters.priceRange;

            // Lọc theo số lượng khách
            const matchGuests = (room.capacity || 2) >= this.filters.guests;

            // Lọc theo từ khóa (Tên hoặc Mô tả)
            const matchSearch = !this.filters.searchQuery ||
                room.displayName.toLowerCase().includes(this.filters.searchQuery.toLowerCase()) ||
                room.displayDesc.toLowerCase().includes(this.filters.searchQuery.toLowerCase());

            // Lọc theo tiện ích (Amenities)
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

            return matchPrice && matchSearch && matchGuests && matchAmenities;
        });

        this.applySort();
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
                // Sắp xếp mặc định (Recommended)
                this.filteredRooms.sort((a, b) => a.id.localeCompare(b.id));
                break;
        }
        this.cdr.detectChanges();
    }

    updateGuests(amount: number) {
        const newValue = this.filters.guests + amount;
        if (newValue >= 1 && newValue <= 10) {
            this.filters.guests = newValue;
            this.applyFilters();
        }
    }

    clearAllFilters() {
        this.filters = {
            searchQuery: '',
            priceRange: 100000000,
            guests: 2,
            amenities: { oceanView: false, privateBalcony: false, kingBed: false }
        };
        this.applyFilters();
    }

    // --- DỮ LIỆU API ---
    loadRooms() {
        this.roomService.getAllRooms().subscribe({
            next: (response: any) => {
                const roomArray = response.data || [];
                this.allRooms = roomArray.map((room: any) => {
                    let finalName = room.name;
                    const lowerName = room.name.toLowerCase();

                    // Chuẩn hóa tên hiển thị từ mã DB
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
                        displayPrice: parseFloat(room.basePrice || room.base_price || 0),
                        capacity: room.capacity || 2,
                        displayDesc: room.description || "Trải nghiệm không gian sang trọng với đầy đủ tiện nghi cao cấp.",
                        image: this.getImageByRoomName(room.name),
                        icons: this.getIconsByRoomName(room.name)
                    };
                });

                this.filteredRooms = [...this.allRooms];
                this.cdr.detectChanges();
            },
            error: (err) => console.error("Không thể tải danh sách phòng:", err)
        });
    }

    // Thêm vào trong class RoomListComponent

    goToDetail(roomId: string): void {
        if (roomId) {
            // Điều hướng sang route /room-detail/ID_CUA_PHONG
            this.router.navigate(['/room-detail', roomId]);
        } else {
            console.error("Room ID không tồn tại!");
        }
    }
    getImageByRoomName(name: string): string {
        const n = name.toLowerCase();
        if (n.includes('deluxe')) return 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000';
        if (n.includes('suite')) return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1000';
        return 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1000';
    }

    getIconsByRoomName(name: string): any[] {
        const n = name.toLowerCase();
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

    logout() {
        this.authService.logout();
        this.router.navigate(['/']);
    }
}