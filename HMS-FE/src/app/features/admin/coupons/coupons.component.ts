import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Coupon {
  code: string;
  discountPercent: number;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  status: 'Active' | 'Expired';
}

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coupons.component.html'
})
export class CouponsComponent implements OnInit {
  coupons: Coupon[] = [
    { code: 'SUMMER24', discountPercent: 15, expiryDate: '2024-08-31', usageLimit: 500, usedCount: 124, status: 'Active' },
    { code: 'WELCOME10', discountPercent: 10, expiryDate: '2024-12-31', usageLimit: 1000, usedCount: 89, status: 'Active' },
    { code: 'FLASH50', discountPercent: 50, expiryDate: '2023-11-01', usageLimit: 50, usedCount: 50, status: 'Expired' }
  ];

  showModal = false;
  showDeleteDialog = false;
  modalMode: 'add' | 'edit' = 'add';
  
  formData: any = {};
  couponToDelete: Coupon | null = null;
  notification: { type: 'success' | 'error', message: string } | null = null;

  ngOnInit() {}

  openAddModal() {
    this.modalMode = 'add';
    this.formData = { code: '', discountPercent: 5, expiryDate: '', usageLimit: 100, usedCount: 0, status: 'Active' };
    this.showModal = true;
  }

  openEditModal(coupon: Coupon) {
    this.modalMode = 'edit';
    this.formData = { ...coupon };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveModal() {
    if (this.modalMode === 'add') {
      this.coupons.push({ ...this.formData, usedCount: 0 });
      this.showToast('success', 'Coupon added successfully!');
    } else {
      const idx = this.coupons.findIndex(c => c.code === this.formData.code);
      if (idx > -1) {
        this.coupons[idx] = { ...this.formData };
        this.showToast('success', 'Coupon updated successfully!');
      }
    }
    this.closeModal();
  }

  openDeleteDialog(coupon: Coupon) {
    this.couponToDelete = coupon;
    this.showDeleteDialog = true;
  }

  closeDeleteDialog() {
    this.showDeleteDialog = false;
    this.couponToDelete = null;
  }

  confirmDelete() {
    if (this.couponToDelete) {
      this.coupons = this.coupons.filter(c => c.code !== this.couponToDelete!.code);
      this.showToast('success', 'Coupon deleted successfully!');
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
