import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff' | 'Guest';
  status: 'Active' | 'Blocked';
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  users: User[] = [
    { id: 'USR-001', name: 'Admin Root', email: 'admin@luxecore.com', role: 'Admin', status: 'Active' },
    { id: 'USR-002', name: 'John Doe', email: 'staff1@luxecore.com', role: 'Staff', status: 'Active' },
    { id: 'USR-003', name: 'Alexander Hamilton', email: 'alex@example.com', role: 'Guest', status: 'Active' },
    { id: 'USR-004', name: 'Banned User', email: 'spammer@fake.com', role: 'Guest', status: 'Blocked' }
  ];

  showModal = false;
  showDeleteDialog = false;
  modalMode: 'add' | 'edit' = 'add';
  
  formData: any = {};
  userToDelete: User | null = null;
  notification: { type: 'success' | 'error', message: string } | null = null;

  ngOnInit() {}

  openAddModal() {
    this.modalMode = 'add';
    this.formData = { name: '', email: '', role: 'Guest', status: 'Active' };
    this.showModal = true;
  }

  openEditModal(user: User) {
    this.modalMode = 'edit';
    this.formData = { ...user };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveModal() {
    if (this.modalMode === 'add') {
      const newId = 'USR-00' + (this.users.length + 1);
      this.users.push({ id: newId, ...this.formData });
      this.showToast('success', 'User added successfully!');
    } else {
      const idx = this.users.findIndex(u => u.id === this.formData.id);
      if (idx > -1) {
        this.users[idx] = { ...this.formData };
        this.showToast('success', 'User updated successfully!');
      }
    }
    this.closeModal();
  }

  openDeleteDialog(user: User) {
    this.userToDelete = user;
    this.showDeleteDialog = true;
  }

  closeDeleteDialog() {
    this.showDeleteDialog = false;
    this.userToDelete = null;
  }

  confirmDelete() {
    if (this.userToDelete) {
      this.users = this.users.filter(u => u.id !== this.userToDelete!.id);
      this.showToast('success', 'User deleted successfully!');
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
