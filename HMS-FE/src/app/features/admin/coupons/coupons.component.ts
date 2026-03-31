import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouponService } from '../../../core/coupon.service';
import { CouponCreateRequest, CouponResponse, DiscountType } from '../../../core/models/coupon.model';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coupons.component.html'
})
export class CouponsComponent implements OnInit {
  coupons: CouponResponse[] = [];
  loading = false;
  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;

  showModal = false;
  showDeleteDialog = false;
  modalMode: 'add' | 'edit' = 'add';
  formData: Partial<CouponCreateRequest & { id: string }> = {};
  couponToDelete: CouponResponse | null = null;
  notification: { type: 'success' | 'error'; message: string } | null = null;
  private notifTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private couponService: CouponService) {}

  ngOnInit(): void {
    this.loadCoupons();
  }

  loadCoupons(): void {
    this.loading = true;
    this.couponService.getCoupons({
      page: this.currentPage - 1,
      size: this.pageSize,
      sort: 'createdAt,desc'
    }).subscribe({
      next: (response) => {
        const page = response?.data;
        this.coupons = page?.content || [];
        this.totalElements = page?.totalElements ?? 0;
        this.totalPages = Math.max(1, page?.totalPages ?? 1);
        this.loading = false;
      },
      error: (error) => {
        this.showToast('error', 'Failed to load coupons.');
        console.error('Error fetching coupons:', error);
        this.loading = false;
      }
    });
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
    this.loadCoupons();
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadCoupons();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadCoupons();
    }
  }

  openAddModal() {
    this.modalMode = 'add';
    this.formData = {
      code: '',
      discountType: 'PERCENT',
      value: 5,
      maxUsage: 100,
      expiresAt: null,
      isActive: true
    };
    this.showModal = true;
  }

  openEditModal(coupon: CouponResponse) {
    this.modalMode = 'edit';
    this.formData = {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      value: coupon.value,
      maxUsage: coupon.maxUsage,
      expiresAt: coupon.expiresAt ? this.toDateTimeLocal(coupon.expiresAt) : null,
      isActive: coupon.isActive
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveModal() {
    if (!this.formData.code?.trim()) {
      this.showToast('error', 'Promo code is required.');
      return;
    }
    if ((this.formData.value ?? 0) <= 0) {
      this.showToast('error', 'Discount value must be greater than 0.');
      return;
    }
    if (this.formData.maxUsage !== null && this.formData.maxUsage !== undefined && this.formData.maxUsage < 1) {
      this.showToast('error', 'Usage limit must be at least 1.');
      return;
    }

    const request: CouponCreateRequest = {
      code: this.formData.code.trim().toUpperCase(),
      discountType: (this.formData.discountType ?? 'PERCENT') as DiscountType,
      value: Number(this.formData.value ?? 0),
      maxUsage: this.formData.maxUsage ?? null,
      expiresAt: this.formData.expiresAt ?? null,
      isActive: this.formData.isActive ?? true
    };

    if (this.modalMode === 'add') {
      this.couponService.createCoupon(request).subscribe({
        next: () => {
          this.showToast('success', 'Coupon added successfully!');
          this.currentPage = 1;
          this.loadCoupons();
          this.closeModal();
        },
        error: (error) => {
          this.showToast('error', 'Failed to add coupon.');
          console.error('Error creating coupon:', error);
        }
      });
      return;
    }

    if (!this.formData.id) return;
    this.couponService.updateCoupon(this.formData.id, request).subscribe({
      next: () => {
        this.showToast('success', 'Coupon updated successfully!');
        this.loadCoupons();
        this.closeModal();
      },
      error: (error) => {
        this.showToast('error', 'Failed to update coupon.');
        console.error('Error updating coupon:', error);
      }
    });
  }

  openDeleteDialog(coupon: CouponResponse) {
    this.couponToDelete = coupon;
    this.showDeleteDialog = true;
  }

  closeDeleteDialog() {
    this.showDeleteDialog = false;
    this.couponToDelete = null;
  }

  confirmDelete() {
    if (!this.couponToDelete?.id) return;
    this.couponService.deleteCoupon(this.couponToDelete.id).subscribe({
      next: () => {
        this.showToast('success', 'Coupon deleted successfully!');
        if (this.coupons.length === 1 && this.currentPage > 1) {
          this.currentPage--;
        }
        this.loadCoupons();
        this.closeDeleteDialog();
      },
      error: (error) => {
        this.showToast('error', 'Failed to delete coupon.');
        console.error('Error deleting coupon:', error);
        this.closeDeleteDialog();
      }
    });
  }

  discountDisplay(coupon: CouponResponse): string {
    return coupon.discountType === 'PERCENT'
      ? `-${Number(coupon.value).toFixed(0)}%`
      : `-${this.formatCurrency(coupon.value)}`;
  }

  usageLimitDisplay(coupon: CouponResponse): string {
    const used = coupon.usedCount ?? 0;
    const max = coupon.maxUsage;
    return max === null ? `${used} / Unlimited` : `${used} / ${max}`;
  }

  statusLabel(coupon: CouponResponse): 'Active' | 'Expired' | 'Inactive' {
    if (!coupon.isActive) return 'Inactive';
    if (coupon.isExpired || coupon.isUsageLimitReached) return 'Expired';
    return 'Active';
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  private toDateTimeLocal(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  showToast(type: 'success' | 'error', message: string) {
    if (this.notifTimer) clearTimeout(this.notifTimer);
    this.notification = { type, message };
    this.notifTimer = setTimeout(() => {
      this.notification = null;
    }, 3000);
  }
}
