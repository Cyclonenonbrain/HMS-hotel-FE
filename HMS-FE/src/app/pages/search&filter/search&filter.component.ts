import { Component, OnInit, ChangeDetectorRef, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RoomService } from '../../services/room.services';
import { AuthService } from '../../services/auth.services';
import { NgxSliderModule, Options } from '@angular-slider/ngx-slider';

@Component({
    selector: 'app-room-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, NgxSliderModule],
    templateUrl: 'search&filter.component.html',
    styleUrls: ['search&filter.component.css']
})
export class RoomListComponent implements OnInit, OnDestroy {
    allRooms: any[] = [];
    filteredRooms: any[] = [];
    isLoggedIn: boolean = false;
    user: any = null;
    isProfileMenuOpen: boolean = false;
    selectedSort: string = 'recommended';
    private authSub!: Subscription;

    filters = {
        searchQuery: '',
        priceMin: 1000000,
        priceMax: 15000000,
        guests: 2,
        amenities: {
            oceanView: false,
            privateBalcony: false,
            kingBed: false
        }
    };

    priceOptions: Options = {
        floor: 1000000,
        ceil: 15000000,
        step: 1000000,
        showTicks: false,
        translate: (value: number): string => `${Math.round(value / 1000000)}M ₫`
    };

    constructor(
        private roomService: RoomService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef,
        private router: Router,
        private eRef: ElementRef
    ) { }

    ngOnInit(): void {
        this.authSub = this.authService.isLoggedIn$.subscribe(status => {
            this.isLoggedIn = status;
            if (status) {
                const userData = localStorage.getItem('currentUser');
                if (userData) {
                    try {
                        const parsedUser = JSON.parse(userData);
                        this.user = {
                            ...parsedUser,
                            fullName: parsedUser.full_name || parsedUser.fullName || 'Guest Member'
                        };
                    } catch (e) { console.error(e); }
                }
            } else {
                this.user = null;
            }
            this.cdr.detectChanges();
        });
        this.loadRooms();
    }

    ngOnDestroy(): void {
        if (this.authSub) this.authSub.unsubscribe();
    }

    // --- FIX: Logic đóng mở Menu ---
    toggleProfileMenu(event: Event): void {
        event.stopPropagation(); // Ngăn sự kiện click trôi lên document
        this.isProfileMenuOpen = !this.isProfileMenuOpen;
        this.cdr.detectChanges();
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: Event): void {
        const target = event.target as HTMLElement;
        // Nếu click không nằm trong vùng .profile-area thì đóng menu
        if (!target.closest('.profile-area')) {
            this.isProfileMenuOpen = false;
            this.cdr.detectChanges();
        }
    }

    applyFilters() {
        this.filteredRooms = this.allRooms.filter(room => {
            const matchPrice = room.displayPrice >= this.filters.priceMin && room.displayPrice <= this.filters.priceMax;
            const matchGuests = (room.capacity || 2) >= this.filters.guests;
            const matchSearch = !this.filters.searchQuery ||
                room.displayName.toLowerCase().includes(this.filters.searchQuery.toLowerCase());

            let matchAmenities = true;
            if (this.filters.amenities.oceanView) 
                matchAmenities = matchAmenities && room.icons.some((i: any) => i.icon === 'water' || i.label.includes('Ocean'));
            if (this.filters.amenities.kingBed) 
                matchAmenities = matchAmenities && room.icons.some((i: any) => i.icon === 'king_bed');
            if (this.filters.amenities.privateBalcony) 
                matchAmenities = matchAmenities && room.icons.some((i: any) => i.icon === 'balcony');

            return matchPrice && matchSearch && matchGuests && matchAmenities;
        });
        this.applySort();
    }

    applySort() {
        if (this.selectedSort === 'low-to-high') {
            this.filteredRooms.sort((a, b) => a.displayPrice - b.displayPrice);
        } else if (this.selectedSort === 'high-to-high') {
            this.filteredRooms.sort((a, b) => b.displayPrice - a.displayPrice);
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
            priceMin: 1000000,
            priceMax: 15000000,
            guests: 2,
            amenities: { oceanView: false, privateBalcony: false, kingBed: false }
        };
        this.applyFilters();
    }

    loadRooms() {
        this.roomService.getAllRooms().subscribe({
            next: (response: any) => {
                const roomArray = response.data || [];
                this.allRooms = roomArray.map((room: any) => {
                    let finalName = room.name;
                    if (room.name.toLowerCase().includes('deluxe')) finalName = "Executive Deluxe Room";
                    
                    const price = this.roomService.getDisplayPrice(room.name, parseFloat(room.basePrice || 0));
                    return {
                        ...room,
                        displayName: finalName,
                        displayPrice: price,
                        category: this.getRoomTierByPrice(price),
                        displayDesc: room.description || "Experience the pinnacle of luxury...",
                        image: this.getImageByRoomName(room.name),
                        icons: this.getIconsByRoomName(room.name)
                    };
                });
                this.filteredRooms = [...this.allRooms];
                this.cdr.detectChanges();
            }
        });
    }

    goToDetail(roomId: string) {
        this.router.navigate(['/room-detail', roomId]);
    }

    getImageByRoomName(name: string): string {
        return name.toLowerCase().includes('deluxe') 
            ? 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000'
            : 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1000';
    }

    getIconsByRoomName(name: string): any[] {
        return [
            { icon: 'king_bed', label: 'King Bed' },
            { icon: 'water', label: 'Ocean View' },
            { icon: 'wifi', label: 'Free WiFi' }
        ];
    }

    getRoomTierByPrice(price: number): string {
        if (price >= 9000000) return 'Suite';
        return 'Deluxe/Superior';
    }

    convertToLuxuryPrice(basePrice: number): number {
        let p = basePrice > 0 && basePrice < 2000 ? basePrice * 25000 : basePrice;
        return p < 3500000 ? 3500000 : p;
    }

    logout() {
        this.authService.logout();
        this.isProfileMenuOpen = false;
        this.router.navigate(['/login']);
    }
}