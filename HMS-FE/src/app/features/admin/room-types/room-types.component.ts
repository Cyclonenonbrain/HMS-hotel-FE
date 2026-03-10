import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface RoomType {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  status: 'Active' | 'Maintenance' | 'Inactive';
}

@Component({
  selector: 'app-room-types',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './room-types.component.html',
  styleUrl: './room-types.component.css'
})
export class RoomTypesComponent {
  roomTypes: RoomType[] = [
    { id: 'RT01', name: 'Standard Room', description: 'Basic amenities, 1 King Bed', price: 100, capacity: 2, status: 'Active' },
    { id: 'RT02', name: 'Deluxe Room', description: 'City view, 2 Queen Beds', price: 150, capacity: 4, status: 'Active' },
    { id: 'RT03', name: 'Suite', description: 'Living area, Ocean view, 1 King Bed', price: 250, capacity: 2, status: 'Maintenance' },
    { id: 'RT04', name: 'Family Room', description: 'Spacious, 2 King Beds, 1 Sofa Bed', price: 200, capacity: 6, status: 'Active' },
    { id: 'RT05', name: 'Penthouse', description: 'Top floor, Panoramic view, 2 Master Bedrooms', price: 500, capacity: 4, status: 'Active' }
  ];

  // Modal state
  showModal = false;
  modalMode: 'add' | 'edit' = 'add';
  showDeleteDialog = false;
  roomToDelete: RoomType | null = null;

  // Form model (used for both add & edit)
  formData: Partial<RoomType> = {};

  // Notification
  notification: { type: 'success' | 'error'; message: string } | null = null;

  // ─── Modals ────────────────────────────────
  openAddModal(): void {
    this.modalMode = 'add';
    this.formData = { name: '', description: '', price: 0, capacity: 1, status: 'Active' };
    this.showModal = true;
  }

  openEditModal(room: RoomType): void {
    this.modalMode = 'edit';
    this.formData = { ...room };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.formData = {};
  }

  saveModal(): void {
    if (!this.formData.name?.trim() || !this.formData.description?.trim()) {
      this.showNotification('error', 'Please fill in all required fields.');
      return;
    }

    if (this.modalMode === 'add') {
      const newId = 'RT' + String(this.roomTypes.length + 1).padStart(2, '0');
      this.roomTypes = [...this.roomTypes, {
        id: newId,
        name: this.formData.name!,
        description: this.formData.description!,
        price: this.formData.price ?? 0,
        capacity: this.formData.capacity ?? 1,
        status: this.formData.status ?? 'Active'
      }];
      this.showNotification('success', 'Room type added successfully!');
    } else {
      this.roomTypes = this.roomTypes.map(r =>
        r.id === this.formData.id ? { ...r, ...this.formData } as RoomType : r
      );
      this.showNotification('success', 'Room type updated successfully!');
    }

    this.closeModal();
  }

  // ─── Delete ────────────────────────────────
  openDeleteDialog(room: RoomType): void {
    this.roomToDelete = room;
    this.showDeleteDialog = true;
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog = false;
    this.roomToDelete = null;
  }

  confirmDelete(): void {
    if (this.roomToDelete) {
      this.roomTypes = this.roomTypes.filter(r => r.id !== this.roomToDelete!.id);
      this.showNotification('success', `"${this.roomToDelete.name}" has been deleted.`);
    }
    this.closeDeleteDialog();
  }

  // ─── Notification ─────────────────────────
  private notifTimer: ReturnType<typeof setTimeout> | null = null;

  showNotification(type: 'success' | 'error', message: string): void {
    if (this.notifTimer) clearTimeout(this.notifTimer);
    this.notification = { type, message };
    this.notifTimer = setTimeout(() => (this.notification = null), 3500);
  }
}
