import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─── Models ────────────────────────────────────────────────────────────────
export interface Amenity {
  name: string;
  icon: string; // Material Symbol name
}

export interface Room {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  roomTypeName: string;
  floor: number;
  description: string;
  price: number;
  capacity: number;
  imageUrl: string;
  amenities: string[];
  status: 'Available' | 'Occupied' | 'Maintenance';
}

// ─── Available Amenities ────────────────────────────────────────────────────
const ALL_AMENITIES: Amenity[] = [
  { name: 'Wi-Fi', icon: 'wifi' },
  { name: 'Pool', icon: 'pool' },
  { name: 'Beach', icon: 'beach_access' },
  { name: 'Butler', icon: 'room_service' },
  { name: 'Gym', icon: 'fitness_center' },
  { name: 'Spa', icon: 'spa' },
  { name: 'Bar', icon: 'local_bar' },
  { name: 'Parking', icon: 'local_parking' },
  { name: 'Balcony', icon: 'deck' },
  { name: 'Kitchen', icon: 'kitchen' },
  { name: 'TV', icon: 'tv' },
  { name: 'Safe', icon: 'lock' },
];

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.css'
})
export class RoomsComponent {
  readonly allAmenities: Amenity[] = ALL_AMENITIES;

  // Room Types for the dropdown
  roomTypes = [
    { id: 'RT01', name: 'Standard Room', price: 100, capacity: 2 },
    { id: 'RT02', name: 'Deluxe Room', price: 150, capacity: 4 },
    { id: 'RT03', name: 'Suite', price: 250, capacity: 2 },
    { id: 'RT04', name: 'Family Room', price: 200, capacity: 6 },
    { id: 'RT05', name: 'Penthouse', price: 500, capacity: 4 },
  ];

  rooms: Room[] = [
    {
      id: 'R001', roomNumber: '101', roomTypeId: 'RT01', roomTypeName: 'Standard Room',
      floor: 1, description: 'Cozy standard room with garden view and modern amenities.', price: 100, capacity: 2,
      imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
      amenities: ['Wi-Fi', 'TV', 'Safe'], status: 'Available'
    },
    {
      id: 'R002', roomNumber: '102', roomTypeId: 'RT01', roomTypeName: 'Standard Room',
      floor: 1, description: 'Sunny standard room overlooking the courtyard.', price: 100, capacity: 2,
      imageUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600&q=80',
      amenities: ['Wi-Fi', 'TV'], status: 'Occupied'
    },
    {
      id: 'R003', roomNumber: '201', roomTypeId: 'RT02', roomTypeName: 'Deluxe Room',
      floor: 2, description: 'Elegant suite featuring panoramic city views, marble bathroom, and exclusive lounge access.', price: 150, capacity: 4,
      imageUrl: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80',
      amenities: ['Wi-Fi', 'Pool', 'Bar', 'Balcony'], status: 'Available'
    },
    {
      id: 'R004', roomNumber: '202', roomTypeId: 'RT02', roomTypeName: 'Deluxe Room',
      floor: 2, description: 'Spacious deluxe room with king bed and city-facing balcony.', price: 150, capacity: 4,
      imageUrl: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80',
      amenities: ['Wi-Fi', 'Pool', 'Balcony'], status: 'Available'
    },
    {
      id: 'R005', roomNumber: '301', roomTypeId: 'RT03', roomTypeName: 'Suite',
      floor: 3, description: 'Private overwater villa with direct ocean access, personal plunge pool, and spacious sundeck.', price: 250, capacity: 2,
      imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80',
      amenities: ['Wi-Fi', 'Pool', 'Beach', 'Spa', 'Butler'], status: 'Available'
    },
    {
      id: 'R006', roomNumber: '401', roomTypeId: 'RT04', roomTypeName: 'Family Room',
      floor: 4, description: 'Spacious family room with two bedrooms, living area, and dedicated kids zone.', price: 200, capacity: 6,
      imageUrl: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?w=600&q=80',
      amenities: ['Wi-Fi', 'TV', 'Kitchen', 'Parking'], status: 'Available'
    },
    {
      id: 'R007', roomNumber: '501', roomTypeId: 'RT05', roomTypeName: 'Penthouse',
      floor: 5, description: 'The ultimate luxury experience spanning the top floor, featuring 360-degree views, private cinema, and butler service.', price: 500, capacity: 4,
      imageUrl: 'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=600&q=80',
      amenities: ['Wi-Fi', 'Pool', 'Butler', 'Gym', 'Bar', 'Balcony'], status: 'Available'
    },
  ];

  // ─── Grouping ──────────────────────────────────────────────────────────────
  get groupedRooms(): { typeName: string; typeId: string; rooms: Room[] }[] {
    const map = new Map<string, Room[]>();
    this.rooms.forEach(r => {
      if (!map.has(r.roomTypeId)) map.set(r.roomTypeId, []);
      map.get(r.roomTypeId)!.push(r);
    });
    return Array.from(map.entries()).map(([typeId, rooms]) => ({
      typeId,
      typeName: rooms[0].roomTypeName,
      rooms
    }));
  }

  getAmenityIcon(name: string): string {
    return this.allAmenities.find(a => a.name === name)?.icon ?? 'check';
  }

  // ─── Modal state ───────────────────────────────────────────────────────────
  showModal = false;
  modalMode: 'add' | 'edit' = 'add';
  showDeleteDialog = false;
  roomToDelete: Room | null = null;
  formData: Partial<Room & { amenitySet: Set<string> }> = {};
  amenitySet = new Set<string>();

  openAddModal(): void {
    this.modalMode = 'add';
    const def = this.roomTypes[0];
    this.formData = {
      roomNumber: '', floor: 1, description: '', status: 'Available',
      roomTypeId: def.id, roomTypeName: def.name, price: def.price, capacity: def.capacity,
      imageUrl: ''
    };
    this.amenitySet = new Set();
    this.showModal = true;
  }

  openEditModal(room: Room): void {
    this.modalMode = 'edit';
    this.formData = { ...room };
    this.amenitySet = new Set(room.amenities);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.formData = {};
    this.amenitySet = new Set();
  }

  onRoomTypeChange(): void {
    const rt = this.roomTypes.find(r => r.id === this.formData.roomTypeId);
    if (rt) {
      this.formData.roomTypeName = rt.name;
      this.formData.price = rt.price;
      this.formData.capacity = rt.capacity;
    }
  }

  toggleAmenity(name: string): void {
    if (this.amenitySet.has(name)) this.amenitySet.delete(name);
    else this.amenitySet.add(name);
  }

  saveModal(): void {
    if (!this.formData.roomNumber?.trim()) {
      this.showNotification('error', 'Room number is required.');
      return;
    }
    const amenities = Array.from(this.amenitySet);
    if (this.modalMode === 'add') {
      const newId = 'R' + String(this.rooms.length + 1).padStart(3, '0');
      this.rooms = [...this.rooms, {
        id: newId,
        roomNumber: this.formData.roomNumber!,
        roomTypeId: this.formData.roomTypeId!,
        roomTypeName: this.formData.roomTypeName!,
        floor: this.formData.floor ?? 1,
        description: this.formData.description ?? '',
        price: this.formData.price ?? 0,
        capacity: this.formData.capacity ?? 1,
        imageUrl: this.formData.imageUrl ?? '',
        amenities,
        status: this.formData.status ?? 'Available'
      }];
      this.showNotification('success', 'Room added successfully!');
    } else {
      this.rooms = this.rooms.map(r =>
        r.id === this.formData.id ? { ...r, ...this.formData, amenities, roomTypeName: this.formData.roomTypeName! } as Room : r
      );
      this.showNotification('success', 'Room updated successfully!');
    }
    this.closeModal();
  }

  // ─── Delete ────────────────────────────────────────────────────────────────
  openDeleteDialog(room: Room): void {
    this.roomToDelete = room;
    this.showDeleteDialog = true;
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog = false;
    this.roomToDelete = null;
  }

  confirmDelete(): void {
    if (this.roomToDelete) {
      this.rooms = this.rooms.filter(r => r.id !== this.roomToDelete!.id);
      this.showNotification('success', `Room ${this.roomToDelete.roomNumber} has been deleted.`);
    }
    this.closeDeleteDialog();
  }

  // ─── Notifications ─────────────────────────────────────────────────────────
  notification: { type: 'success' | 'error'; message: string } | null = null;
  private notifTimer: ReturnType<typeof setTimeout> | null = null;

  showNotification(type: 'success' | 'error', message: string): void {
    if (this.notifTimer) clearTimeout(this.notifTimer);
    this.notification = { type, message };
    this.notifTimer = setTimeout(() => (this.notification = null), 3500);
  }
}
