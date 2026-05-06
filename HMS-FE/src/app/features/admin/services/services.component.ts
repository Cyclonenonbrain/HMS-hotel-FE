import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { VndPipe } from '../../../core/vnd.pipe';
import { HotelServiceService } from '../../../core/hotel-service.service';
import { HotelServiceCreateRequest, HotelServiceResponse } from '../../../core/models/hotel-service.model';

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [CommonModule, FormsModule, VndPipe],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css'
})
export class ServicesComponent implements OnInit {
  services: HotelServiceResponse[] = [];
  loading = false;
  searchTerm = '';
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;

  showModal = false;
  showDeleteDialog = false;
  modalMode: 'add' | 'edit' = 'add';
  formData: Partial<HotelServiceCreateRequest & { id: string }> = {};
  serviceToDelete: HotelServiceResponse | null = null;
  notification: { type: 'success' | 'error'; message: string } | null = null;
  private notifTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private hotelServiceService: HotelServiceService) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.loading = true;
    this.hotelServiceService.getServices({
      q: this.searchTerm.trim() || undefined,
      isActive: this.statusFilter === 'ALL' ? undefined : this.statusFilter === 'ACTIVE',
      page: this.currentPage - 1,
      size: this.pageSize,
      sort: 'createdAt,desc'
    }).subscribe({
      next: (response) => {
        const page = response?.data;
        this.services = page?.content || [];
        this.totalElements = page?.totalElements ?? 0;
        this.totalPages = Math.max(1, page?.totalPages ?? 1);
        this.loading = false;
      },
      error: (error) => {
        this.showToast('error', 'Failed to load services.');
        console.error('Error fetching services:', error);
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadServices();
  }

  get visiblePages(): (number | string)[] {
    const total = this.totalPages;
    if (total <= 6) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const arr: (number | string)[] = [1, 2, 3];
    if (this.currentPage > 4) arr.push('...');
    if (this.currentPage > 3 && this.currentPage < total - 2) arr.push(this.currentPage);
    if (this.currentPage < total - 3) arr.push('...');
    arr.push(total - 2, total - 1, total);
    return arr;
  }

  goToPage(page: number | string): void {
    if (typeof page !== 'number' || page === this.currentPage) return;
    this.currentPage = page;
    this.loadServices();
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadServices();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadServices();
    }
  }

  openAddModal(): void {
    this.modalMode = 'add';
    this.formData = { name: '', price: 0, isActive: true };
    this.showModal = true;
  }

  openEditModal(service: HotelServiceResponse): void {
    this.modalMode = 'edit';
    this.formData = {
      id: service.id,
      name: service.name,
      price: service.price,
      isActive: service.isActive
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.formData = {};
  }

  saveModal(): void {
    if (!this.formData.name?.trim()) {
      this.showToast('error', 'Service name is required.');
      return;
    }
    if ((this.formData.price ?? 0) < 0) {
      this.showToast('error', 'Price must be >= 0.');
      return;
    }

    const request: HotelServiceCreateRequest = {
      name: this.formData.name.trim(),
      price: this.formData.price ?? 0,
      isActive: this.formData.isActive ?? true
    };

    if (this.modalMode === 'add') {
      this.hotelServiceService.createService(request).subscribe({
        next: () => {
          this.showToast('success', 'Service added successfully!');
          this.currentPage = 1;
          this.loadServices();
          this.closeModal();
        },
        error: (error) => {
          this.showToast('error', 'Failed to add service.');
          console.error('Error creating service:', error);
        }
      });
      return;
    }

    if (!this.formData.id) return;
    this.hotelServiceService.updateService(this.formData.id, request).subscribe({
      next: () => {
        this.showToast('success', 'Service updated successfully!');
        this.loadServices();
        this.closeModal();
      },
      error: (error) => {
        this.showToast('error', 'Failed to update service.');
        console.error('Error updating service:', error);
      }
    });
  }

  openDeleteDialog(service: HotelServiceResponse): void {
    this.serviceToDelete = service;
    this.showDeleteDialog = true;
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog = false;
    this.serviceToDelete = null;
  }

  confirmDelete(): void {
    if (!this.serviceToDelete?.id) return;
    this.hotelServiceService.deleteService(this.serviceToDelete.id).subscribe({
      next: () => {
        this.showToast('success', 'Service deleted successfully!');
        if (this.services.length === 1 && this.currentPage > 1) {
          this.currentPage--;
        }
        this.loadServices();
        this.closeDeleteDialog();
      },
      error: (error) => {
        this.showToast('error', this.getApiErrorMessage(error, 'Failed to delete service.'));
        console.error('Error deleting service:', error);
        this.closeDeleteDialog();
      }
    });
  }

  showToast(type: 'success' | 'error', message: string): void {
    if (this.notifTimer) clearTimeout(this.notifTimer);
    this.notification = { type, message };
    this.notifTimer = setTimeout(() => (this.notification = null), 3000);
  }

  private getApiErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    const payload = error.error;
    if (payload && typeof payload === 'object' && 'message' in payload) {
      const message = (payload as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    if (error.status === 409) {
      return 'Service is being used in booking records, cannot delete.';
    }

    return fallback;
  }
}
