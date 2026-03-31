import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RoomService } from '../../services/room.services';
import { AuthService } from '../../services/auth.services';
import { RoomSearchService, RoomSearchResult } from '../../services/room-search.service';
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

    // --- DATE PICKER STATE ---
    checkIn: string = RoomSearchService.getToday();
    checkOut: string = RoomSearchService.getTomorrow();
    numberOfNights: number = 1;
    minCheckInDate: string = RoomSearchService.getToday();

    // --- LOADING & ERROR STATE ---
    isLoading: boolean = false;
    errorMessage: string = '';

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
        private roomSearchService: RoomSearchService,
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

    // --- DATE VALIDATION & HANDLERS ---
    onCheckInChange(): void {
        // Ensure check-out is at least 1 day after check-in
        if (this.checkOut <= this.checkIn) {
            const nextDay = new Date(this.checkIn);
            nextDay.setDate(nextDay.getDate() + 1);
            this.checkOut = nextDay.toISOString().split('T')[0];
        }
        this.updateNights();
        this.loadRooms();
    }

    onCheckOutChange(): void {
        // Validate check-out is after check-in
        if (this.checkOut <= this.checkIn) {
            const nextDay = new Date(this.checkIn);
            nextDay.setDate(nextDay.getDate() + 1);
            this.checkOut = nextDay.toISOString().split('T')[0];
        }
        this.updateNights();
        this.loadRooms();
    }

    updateNights(): void {
        this.numberOfNights = RoomSearchService.calculateNights(this.checkIn, this.checkOut);
    }

    isDateValid(): boolean {
        return this.checkIn < this.checkOut && this.numberOfNights >= 1;
    }

    // --- LOGIC LỌC PHÒNG (Client-side cho keyword search) ---
    applyFilters() {
        // Reload từ API khi filter chính thay đổi (price, guests, amenities)
        this.loadRooms();
    }

    // Client-side filter chỉ cho keyword search (nhanh hơn, không cần gọi API)
    applyClientFilters() {
        this.filteredRooms = this.allRooms.filter(room => {
            // Lọc theo từ khóa (Tên hoặc Mô tả) - client side
            const matchSearch = !this.filters.searchQuery ||
                room.displayName.toLowerCase().includes(this.filters.searchQuery.toLowerCase()) ||
                room.displayDesc.toLowerCase().includes(this.filters.searchQuery.toLowerCase());

            return matchSearch;
        });

        // Sort đã được BE handle, chỉ sort lại nếu là "recommended"
        if (this.selectedSort === 'recommended') {
            this.filteredRooms.sort((a, b) => a.id.localeCompare(b.id));
        }
        this.cdr.detectChanges();
    }

    applySort() {
        // Reload với sort mới từ BE
        this.loadRooms();
    }

    // Chỉ filter keyword - không gọi API
    onSearchInput() {
        this.applyClientFilters();
    }

    updateGuests(amount: number) {
        const newValue = this.filters.guests + amount;
        if (newValue >= 1 && newValue <= 10) {
            this.filters.guests = newValue;
            this.loadRooms(); // Reload từ API
        }
    }

    clearAllFilters() {
        this.filters = {
            searchQuery: '',
            priceRange: 100000000,
            guests: 2,
            amenities: { oceanView: false, privateBalcony: false, kingBed: false }
        };
        this.selectedSort = 'recommended';
        this.loadRooms();
    }

    // --- DỮ LIỆU API ---
    loadRooms() {
        if (!this.isDateValid()) {
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        // Clear danh sách cũ khi bắt đầu load
        this.filteredRooms = [];

        // Build amenities array from filters
        const amenities: string[] = [];
        if (this.filters.amenities.oceanView) amenities.push('Ocean View');
        if (this.filters.amenities.privateBalcony) amenities.push('Balcony');
        if (this.filters.amenities.kingBed) amenities.push('King Bed');

        // Map sort option to BE format
        let sortBy: 'price_asc' | 'price_desc' | undefined;
        if (this.selectedSort === 'low-to-high') {
            sortBy = 'price_asc';
        } else if (this.selectedSort === 'high-to-high') {
            sortBy = 'price_desc';
        }

        this.roomSearchService.searchRooms({
            checkIn: this.checkIn,
            checkOut: this.checkOut,
            adults: this.filters.guests,
            maxPrice: this.filters.priceRange < 100000000 ? this.filters.priceRange : undefined,
            amenities: amenities.length > 0 ? amenities : undefined,
            sortBy: sortBy
        }).subscribe({
            next: (rooms: RoomSearchResult[]) => {
                this.allRooms = rooms.map((room: RoomSearchResult) => {
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
                        id: room.roomTypeId,
                        displayName: finalName,
                        displayPrice: room.pricePerNight,
                        capacity: room.capacity,
                        displayDesc: room.description || "Trải nghiệm không gian sang trọng với đầy đủ tiện nghi cao cấp.",
                        image: room.thumbnailUrl || this.getImageByRoomName(room.name),
                        icons: room.amenities?.length > 0 ? this.mapAmenitiesToIcons(room.amenities) : this.getIconsByRoomName(room.name),
                        rating: room.rating || 4.9,
                        availableRooms: room.availableRooms
                    };
                });

                this.filteredRooms = [...this.allRooms];
                this.applyClientFilters();
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error("Không thể tải danh sách phòng:", err);
                this.errorMessage = 'Không thể tải danh sách phòng. Vui lòng thử lại.';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    // Map amenities from BE to icon format for UI
    mapAmenitiesToIcons(amenities: string[]): any[] {
        const iconMap: { [key: string]: { icon: string, label: string } } = {
            'wifi': { icon: 'wifi', label: 'Free WiFi' },
            'WiFi': { icon: 'wifi', label: 'Free WiFi' },
            'balcony': { icon: 'balcony', label: 'Balcony' },
            'Balcony': { icon: 'balcony', label: 'Balcony' },
            'ocean_view': { icon: 'water', label: 'Ocean View' },
            'Ocean View': { icon: 'water', label: 'Ocean View' },
            'king_bed': { icon: 'king_bed', label: 'King Bed' },
            'King Bed': { icon: 'king_bed', label: 'King Bed' },
            'queen_bed': { icon: 'bed', label: 'Queen Bed' },
            'Queen Bed': { icon: 'bed', label: 'Queen Bed' },
            'AC': { icon: 'ac_unit', label: 'AC' },
            'TV': { icon: 'tv', label: 'TV' }
        };

        return amenities
            .map(a => iconMap[a] || { icon: 'check_circle', label: a })
            .filter((v, i, arr) => arr.findIndex(x => x.label === v.label) === i); // Remove duplicates
    }

    // --- AVAILABILITY BADGE HELPERS ---
    getAvailabilityBadgeClass(room: any): string {
        if (room.availableRooms === 0) {
            return 'badge-soldout';
        } else if (room.availableRooms <= 5) {
            return 'badge-limited';
        }
        return 'badge-available';
    }

    getAvailabilityText(room: any): string {
        if (room.availableRooms === 0) {
            return 'Sold out';
        } else if (room.availableRooms <= 5) {
            return `Only ${room.availableRooms} left`;
        }
        return `${room.availableRooms} available`;
    }

    isRoomAvailable(room: any): boolean {
        return room.availableRooms > 0;
    }

    goToDetail(roomId: string, room?: any): void {
        if (roomId) {
            // Navigate với query params cho check-in/check-out
            this.router.navigate(['/room-detail', roomId], {
                queryParams: {
                    checkIn: this.checkIn,
                    checkOut: this.checkOut,
                    guests: this.filters.guests
                }
            });
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