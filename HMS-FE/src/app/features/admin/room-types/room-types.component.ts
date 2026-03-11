import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomTypeService } from '../../../core/room-type.service';
import { RoomTypeResponse, RoomTypeCreateRequest } from '../../../core/models/room-type.model';

@Component({
  selector: 'app-room-types',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './room-types.component.html',
  styleUrl: './room-types.component.css'
})
export class RoomTypesComponent implements OnInit {
  roomTypes: RoomTypeResponse[] = [];

  // Modal state
  showModal = false;
  modalMode: 'add' | 'edit' = 'add';
  showDeleteDialog = false;
  roomToDelete: RoomTypeResponse | null = null;

  // Form model (used for both add & edit)
  formData: Partial<RoomTypeResponse> = {};

  // Notification
  notification: { type: 'success' | 'error'; message: string } | null = null;

  constructor(private roomTypeService: RoomTypeService) {}

  ngOnInit(): void {
    this.loadRoomTypes();
  }

  loadRoomTypes(): void {
    this.roomTypeService.getRoomTypes().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.roomTypes = response.data;
        }
      },
      error: (error) => {
        this.showNotification('error', 'Failed to load room types.');
        console.error('Error fetching room types:', error);
      }
    });
  }

  // ─── Modals ────────────────────────────────
  openAddModal(): void {
    this.modalMode = 'add';
    this.formData = { name: '', description: '', basePrice: 0, capacity: 1 };
    this.showModal = true;
  }

  openEditModal(room: RoomTypeResponse): void {
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

    const request: RoomTypeCreateRequest = {
      name: this.formData.name,
      description: this.formData.description,
      basePrice: this.formData.basePrice ?? 0,
      capacity: this.formData.capacity ?? 1
    };

    if (this.modalMode === 'add') {
      this.roomTypeService.createRoomType(request).subscribe({
        next: (response) => {
          this.showNotification('success', 'Room type added successfully!');
          this.loadRoomTypes();
          this.closeModal();
        },
        error: (error) => {
          this.showNotification('error', 'Failed to add room type.');
          console.error('Error creating room type:', error);
        }
      });
    } else {
      if (!this.formData.id) return;
      this.roomTypeService.updateRoomType(this.formData.id, request).subscribe({
        next: (response) => {
          this.showNotification('success', 'Room type updated successfully!');
          this.loadRoomTypes();
          this.closeModal();
        },
        error: (error) => {
          this.showNotification('error', 'Failed to update room type.');
          console.error('Error updating room type:', error);
        }
      });
    }
  }

  // ─── Delete ────────────────────────────────
  openDeleteDialog(room: RoomTypeResponse): void {
    this.roomToDelete = room;
    this.showDeleteDialog = true;
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog = false;
    this.roomToDelete = null;
  }

  confirmDelete(): void {
    if (this.roomToDelete && this.roomToDelete.id) {
      this.roomTypeService.deleteRoomType(this.roomToDelete.id).subscribe({
        next: () => {
          this.showNotification('success', `"${this.roomToDelete?.name}" has been deleted.`);
          this.loadRoomTypes();
          this.closeDeleteDialog();
        },
        error: (error) => {
          this.showNotification('error', 'Failed to delete room type.');
          console.error('Error deleting room type:', error);
          this.closeDeleteDialog();
        }
      });
    }
  }

  // ─── Notification ─────────────────────────
  private notifTimer: ReturnType<typeof setTimeout> | null = null;

  showNotification(type: 'success' | 'error', message: string): void {
    if (this.notifTimer) clearTimeout(this.notifTimer);
    this.notification = { type, message };
    this.notifTimer = setTimeout(() => (this.notification = null), 3500);
  }
}
