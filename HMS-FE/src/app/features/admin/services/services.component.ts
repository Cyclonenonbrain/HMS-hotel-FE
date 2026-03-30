import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  status: 'Active' | 'Inactive';
}

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './services.component.html'
})
export class ServicesComponent implements OnInit {
  services: ServiceItem[] = [
    { id: 'SRV-001', name: 'Airport Transfer', description: 'Luxury car pickup from airport', category: 'Transport', price: 50, status: 'Active' },
    { id: 'SRV-002', name: 'Spa Massage', description: '60-minute full body massage', category: 'Wellness', price: 120, status: 'Active' },
    { id: 'SRV-003', name: 'Champagne Breakfast', description: 'In-room premium breakfast', category: 'Dining', price: 80, status: 'Inactive' }
  ];

  showModal = false;
  showDeleteDialog = false;
  modalMode: 'add' | 'edit' = 'add';
  
  formData: any = {};
  serviceToDelete: ServiceItem | null = null;
  notification: { type: 'success' | 'error', message: string } | null = null;

  ngOnInit() {}

  openAddModal() {
    this.modalMode = 'add';
    this.formData = { name: '', description: '', category: 'Wellness', price: 0, status: 'Active' };
    this.showModal = true;
  }

  openEditModal(service: ServiceItem) {
    this.modalMode = 'edit';
    this.formData = { ...service };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveModal() {
    if (this.modalMode === 'add') {
      const newId = 'SRV-00' + (this.services.length + 1);
      this.services.push({ id: newId, ...this.formData });
      this.showToast('success', 'Service added successfully!');
    } else {
      const idx = this.services.findIndex(s => s.id === this.formData.id);
      if (idx > -1) {
        this.services[idx] = { ...this.formData };
        this.showToast('success', 'Service updated successfully!');
      }
    }
    this.closeModal();
  }

  openDeleteDialog(service: ServiceItem) {
    this.serviceToDelete = service;
    this.showDeleteDialog = true;
  }

  closeDeleteDialog() {
    this.showDeleteDialog = false;
    this.serviceToDelete = null;
  }

  confirmDelete() {
    if (this.serviceToDelete) {
      this.services = this.services.filter(s => s.id !== this.serviceToDelete!.id);
      this.showToast('success', 'Service deleted successfully!');
      this.closeDeleteDialog();
    }
  }

  showToast(type: 'success' | 'error', message: string) {
    this.notification = { type, message };
    setTimeout(() => {
      this.notification = null;
    }, 3000);
  }
}
