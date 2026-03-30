import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Review {
  id: string;
  guestName: string;
  roomType: string;
  rating: number;
  comment: string;
  date: string;
  status: 'Published' | 'Hidden';
}

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reviews.component.html'
})
export class ReviewsComponent implements OnInit {
  reviews: Review[] = [
    { id: 'REV-01', guestName: 'Alice Smith', roomType: 'King Deluxe', rating: 5, comment: 'Incredible stay! Staff was amazing.', date: '2023-10-20', status: 'Published' },
    { id: 'REV-02', guestName: 'Bob Johnson', roomType: 'Suite', rating: 4, comment: 'Great room, but AC was a bit loud.', date: '2023-10-18', status: 'Published' },
    { id: 'REV-03', guestName: 'Anonymous', roomType: 'Double Queen', rating: 1, comment: 'Terrible experience.', date: '2023-10-15', status: 'Hidden' }
  ];

  showEditModal = false;
  showDeleteDialog = false;
  
  formData: any = {};
  reviewToDelete: Review | null = null;
  notification: { type: 'success' | 'error', message: string } | null = null;

  ngOnInit() {}

  openEditModal(review: Review) {
    this.formData = { ...review };
    this.showEditModal = true;
  }

  closeModal() {
    this.showEditModal = false;
  }

  saveModal() {
    const idx = this.reviews.findIndex(r => r.id === this.formData.id);
    if (idx > -1) {
      this.reviews[idx] = { ...this.formData };
      this.showToast('success', 'Review status updated successfully!');
    }
    this.closeModal();
  }

  openDeleteDialog(review: Review) {
    this.reviewToDelete = review;
    this.showDeleteDialog = true;
  }

  closeDeleteDialog() {
    this.showDeleteDialog = false;
    this.reviewToDelete = null;
  }

  confirmDelete() {
    if (this.reviewToDelete) {
      this.reviews = this.reviews.filter(r => r.id !== this.reviewToDelete!.id);
      this.showToast('success', 'Review deleted successfully!');
      this.closeDeleteDialog();
    }
  }

  getArray(rating: number) { return new Array(rating); }
  getEmptyArray(rating: number) { return new Array(5 - rating); }

  showToast(type: 'success' | 'error', message: string) {
    this.notification = { type, message };
    setTimeout(() => {
      this.notification = null;
    }, 3000);
  }
}
