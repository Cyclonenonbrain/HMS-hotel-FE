import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/user.service';
import { AdminUserCreateRequest, AdminUserResponse, UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  users: AdminUserResponse[] = [];
  loading = false;
  searchTerm = '';
  roleFilter: 'ALL' | UserRole = 'ALL';
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';
  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;

  showModal = false;
  showDeleteDialog = false;
  modalMode: 'add' | 'edit' = 'add';
  formData: Partial<AdminUserCreateRequest & { id: string; password: string }> = {};
  userToDelete: AdminUserResponse | null = null;
  notification: { type: 'success' | 'error'; message: string } | null = null;
  private notifTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers({
      q: this.searchTerm.trim() || undefined,
      role: this.roleFilter === 'ALL' ? undefined : this.roleFilter,
      isActive: this.statusFilter === 'ALL' ? undefined : this.statusFilter === 'ACTIVE',
      page: this.currentPage - 1,
      size: this.pageSize,
      sort: 'createdAt,desc'
    }).subscribe({
      next: (response) => {
        const page = response?.data;
        this.users = page?.content || [];
        this.totalElements = page?.totalElements ?? 0;
        this.totalPages = Math.max(1, page?.totalPages ?? 1);
        this.loading = false;
      },
      error: (error) => {
        this.showToast('error', 'Failed to load users.');
        console.error('Error fetching users:', error);
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadUsers();
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
    this.loadUsers();
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  openAddModal() {
    this.modalMode = 'add';
    this.formData = {
      fullName: '',
      email: '',
      password: '',
      phone: '',
      role: 'CUSTOMER',
      isActive: true
    };
    this.showModal = true;
  }

  openEditModal(user: AdminUserResponse) {
    this.modalMode = 'edit';
    this.formData = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      password: '',
      phone: user.phone ?? '',
      role: user.role,
      isActive: user.isActive
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.formData = {};
  }

  saveModal() {
    if (!this.formData.fullName?.trim()) {
      this.showToast('error', 'Full name is required.');
      return;
    }
    if (!this.formData.email?.trim()) {
      this.showToast('error', 'Email is required.');
      return;
    }

    if (this.modalMode === 'add') {
      if (!this.formData.password?.trim() || this.formData.password.length < 6) {
        this.showToast('error', 'Password must be at least 6 characters.');
        return;
      }
      const createRequest: AdminUserCreateRequest = {
        fullName: this.formData.fullName.trim(),
        email: this.formData.email.trim(),
        password: this.formData.password,
        phone: this.formData.phone?.trim() || null,
        role: (this.formData.role ?? 'CUSTOMER') as UserRole,
        isActive: this.formData.isActive ?? true
      };
      this.userService.createUser(createRequest).subscribe({
        next: () => {
          this.showToast('success', 'User added successfully!');
          this.currentPage = 1;
          this.loadUsers();
          this.closeModal();
        },
        error: (error) => {
          this.showToast('error', 'Failed to add user.');
          console.error('Error creating user:', error);
        }
      });
      return;
    }

    if (!this.formData.id) return;
    const updateRequest = {
      fullName: this.formData.fullName.trim(),
      email: this.formData.email.trim(),
      password: this.formData.password?.trim() ? this.formData.password : undefined,
      phone: this.formData.phone?.trim() || null,
      role: this.formData.role as UserRole,
      isActive: this.formData.isActive ?? true
    };
    this.userService.updateUser(this.formData.id, updateRequest).subscribe({
      next: () => {
        this.showToast('success', 'User updated successfully!');
        this.loadUsers();
        this.closeModal();
      },
      error: (error) => {
        this.showToast('error', 'Failed to update user.');
        console.error('Error updating user:', error);
      }
    });
  }

  openDeleteDialog(user: AdminUserResponse) {
    this.userToDelete = user;
    this.showDeleteDialog = true;
  }

  closeDeleteDialog() {
    this.showDeleteDialog = false;
    this.userToDelete = null;
  }

  confirmDelete() {
    if (!this.userToDelete?.id) return;
    this.userService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.showToast('success', 'User deleted successfully!');
        if (this.users.length === 1 && this.currentPage > 1) {
          this.currentPage--;
        }
        this.loadUsers();
        this.closeDeleteDialog();
      },
      error: (error) => {
        this.showToast('error', 'Failed to delete user.');
        console.error('Error deleting user:', error);
        this.closeDeleteDialog();
      }
    });
  }

  roleLabel(user: AdminUserResponse): 'Admin' | 'Staff' | 'Guest' {
    if (user.role === 'ADMIN') return 'Admin';
    if (user.role === 'STAFF') return 'Staff';
    return 'Guest';
  }

  statusLabel(user: AdminUserResponse): 'Active' | 'Blocked' {
    return user.isActive ? 'Active' : 'Blocked';
  }

  showToast(type: 'success' | 'error', message: string) {
    if (this.notifTimer) clearTimeout(this.notifTimer);
    this.notification = { type, message };
    this.notifTimer = setTimeout(() => {
      this.notification = null;
    }, 3000);
  }
}
