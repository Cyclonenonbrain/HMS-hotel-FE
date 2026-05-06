import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AmenityService } from '../../../core/amenity.service';
import { AmenityCreateRequest, AmenityResponse } from '../../../core/models/amenity.model';

@Component({
  selector: 'app-admin-amenities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './amenities.component.html'
})
export class AmenitiesComponent implements OnInit {
  amenities: AmenityResponse[] = [];
  showModal = false;
  modalMode: 'add' | 'edit' = 'add';
  showDeleteDialog = false;
  amenityToDelete: AmenityResponse | null = null;
  formData: Partial<AmenityResponse> = {};
  notification: { type: 'success' | 'error'; message: string } | null = null;

  constructor(private amenityService: AmenityService) {}

  ngOnInit(): void {
    this.loadAmenities();
  }

  loadAmenities(): void {
    this.amenityService.getAmenities().subscribe({
      next: (res) => (this.amenities = res.data || []),
      error: () => this.showToast('error', 'Failed to load amenities.')
    });
  }

  openAddModal(): void {
    this.modalMode = 'add';
    this.formData = { code: '', name: '' };
    this.showModal = true;
  }

  openEditModal(item: AmenityResponse): void {
    this.modalMode = 'edit';
    this.formData = { ...item };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.formData = {};
  }

  saveModal(): void {
    if (!this.formData.code?.trim() || !this.formData.name?.trim()) {
      this.showToast('error', 'Code and name are required.');
      return;
    }

    const payload: AmenityCreateRequest = {
      code: this.formData.code,
      name: this.formData.name
    };

    if (this.modalMode === 'add') {
      this.amenityService.createAmenity(payload).subscribe({
        next: () => {
          this.showToast('success', 'Amenity created.');
          this.loadAmenities();
          this.closeModal();
        },
        error: (e) => this.showToast('error', e?.error?.message || 'Failed to create amenity.')
      });
      return;
    }

    if (!this.formData.id) return;
    this.amenityService.updateAmenity(this.formData.id, payload).subscribe({
      next: () => {
        this.showToast('success', 'Amenity updated.');
        this.loadAmenities();
        this.closeModal();
      },
      error: (e) => this.showToast('error', e?.error?.message || 'Failed to update amenity.')
    });
  }

  openDeleteDialog(item: AmenityResponse): void {
    this.amenityToDelete = item;
    this.showDeleteDialog = true;
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog = false;
    this.amenityToDelete = null;
  }

  confirmDelete(): void {
    if (!this.amenityToDelete?.id) return;
    this.amenityService.deleteAmenity(this.amenityToDelete.id).subscribe({
      next: () => {
        this.showToast('success', 'Amenity deleted.');
        this.loadAmenities();
        this.closeDeleteDialog();
      },
      error: (e) => this.showToast('error', e?.error?.message || 'Failed to delete amenity.')
    });
  }

  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  showToast(type: 'success' | 'error', message: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.notification = { type, message };
    this.toastTimer = setTimeout(() => (this.notification = null), 3000);
  }
}
