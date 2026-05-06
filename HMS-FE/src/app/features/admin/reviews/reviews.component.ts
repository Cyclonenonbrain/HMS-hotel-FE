import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminReviewService } from '../../../core/admin-review.service';
import { AdminReviewResponse } from '../../../core/models/admin-review.model';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reviews.component.html'
})
export class ReviewsComponent implements OnInit {
  reviews: AdminReviewResponse[] = [];
  loading = false;
  searchTerm = '';
  ratingFilter: 'ALL' | number = 'ALL';
  statusFilter: 'ALL' | 'PUBLISHED' | 'HIDDEN' = 'ALL';
  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;

  showEditModal = false;
  showDeleteDialog = false;
  formData: Partial<AdminReviewResponse> = {};
  reviewToDelete: AdminReviewResponse | null = null;
  notification: { type: 'success' | 'error'; message: string } | null = null;
  private notifTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private adminReviewService: AdminReviewService) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.loading = true;
    this.adminReviewService.getReviews({
      q: this.searchTerm.trim() || undefined,
      rating: this.ratingFilter === 'ALL' ? undefined : this.ratingFilter,
      isVisible: this.statusFilter === 'ALL' ? undefined : this.statusFilter === 'PUBLISHED',
      page: this.currentPage - 1,
      size: this.pageSize,
      sort: 'createdAt,desc'
    }).subscribe({
      next: (response) => {
        const page = response?.data;
        this.reviews = page?.content || [];
        this.totalElements = page?.totalElements ?? 0;
        this.totalPages = Math.max(1, page?.totalPages ?? 1);
        this.loading = false;
      },
      error: (error) => {
        this.showToast('error', 'Failed to load reviews.');
        console.error('Error fetching reviews:', error);
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadReviews();
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
    this.loadReviews();
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadReviews();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadReviews();
    }
  }

  openEditModal(review: AdminReviewResponse) {
    this.formData = { ...review };
    this.showEditModal = true;
  }

  closeModal() {
    this.showEditModal = false;
  }

  saveModal() {
    if (!this.formData.id) return;
    const current = this.reviews.find((review) => review.id === this.formData.id);
    if (!current) return;

    if (this.formData.isVisible === current.isVisible) {
      this.closeModal();
      return;
    }

    this.adminReviewService.toggleVisibility(this.formData.id).subscribe({
      next: () => {
        this.showToast('success', 'Review status updated successfully!');
        this.loadReviews();
        this.closeModal();
      },
      error: (error) => {
        this.showToast('error', 'Failed to update review status.');
        console.error('Error toggling review visibility:', error);
      }
    });
  }

  openDeleteDialog(review: AdminReviewResponse) {
    this.reviewToDelete = review;
    this.showDeleteDialog = true;
  }

  closeDeleteDialog() {
    this.showDeleteDialog = false;
    this.reviewToDelete = null;
  }

  confirmDelete() {
    if (!this.reviewToDelete?.id) return;
    this.adminReviewService.deleteReview(this.reviewToDelete.id).subscribe({
      next: () => {
        this.showToast('success', 'Review deleted successfully!');
        if (this.reviews.length === 1 && this.currentPage > 1) {
          this.currentPage--;
        }
        this.loadReviews();
        this.closeDeleteDialog();
      },
      error: (error) => {
        this.showToast('error', 'Failed to delete review.');
        console.error('Error deleting review:', error);
        this.closeDeleteDialog();
      }
    });
  }

  getArray(rating: number) { return new Array(rating); }
  getEmptyArray(rating: number) { return new Array(5 - rating); }

  statusLabel(review: AdminReviewResponse): 'Published' | 'Hidden' {
    return review.isVisible ? 'Published' : 'Hidden';
  }

  showToast(type: 'success' | 'error', message: string) {
    if (this.notifTimer) clearTimeout(this.notifTimer);
    this.notification = { type, message };
    this.notifTimer = setTimeout(() => {
      this.notification = null;
    }, 3000);
  }
}
