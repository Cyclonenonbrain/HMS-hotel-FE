import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomService } from '../../../core/room.service';
import { RoomCreateRequest, RoomResponse, RoomStatus } from '../../../core/models/room.model';
import { RoomTypeResponse } from '../../../core/models/room-type.model';
import { RoomTypeService } from '../../../core/room-type.service';
import { VndPipe } from '../../../core/vnd.pipe';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, VndPipe],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.css'
})
export class RoomsComponent implements OnInit {
  rooms: RoomResponse[] = [];
  roomTypes: RoomTypeResponse[] = [];

  loading = false;
  searchTerm = '';
  statusFilter: 'ALL' | RoomStatus = 'ALL';
  typeFilter = 'ALL';

  currentPage = 1;
  pageSize = 10;

  showModal = false;
  modalMode: 'add' | 'edit' = 'add';
  showDeleteDialog = false;
  roomToDelete: RoomResponse | null = null;
  formData: Partial<RoomCreateRequest & { id: string }> = {};
  notification: { type: 'success' | 'error'; message: string } | null = null;
  private notifTimer: ReturnType<typeof setTimeout> | null = null;

  readonly roomStatuses: RoomStatus[] = ['AVAILABLE', 'BOOKED', 'OCCUPIED', 'DIRTY', 'MAINTENANCE'];

  constructor(
    private roomService: RoomService,
    private roomTypeService: RoomTypeService
  ) {}

  ngOnInit(): void {
    this.loadRoomTypes();
    this.loadRooms();
  }

  loadRoomTypes(): void {
    this.roomTypeService.getRoomTypes().subscribe({
      next: (response) => {
        this.roomTypes = response?.data || [];
      },
      error: (error) => {
        this.showNotification('error', 'Failed to load room types.');
        console.error('Error fetching room types:', error);
      }
    });
  }

  loadRooms(): void {
    this.loading = true;
    this.roomService.getRooms().subscribe({
      next: (response) => {
        this.rooms = response?.data || [];
        this.syncCurrentPage();
        this.loading = false;
      },
      error: (error) => {
        this.showNotification('error', 'Failed to load rooms.');
        console.error('Error fetching rooms:', error);
        this.loading = false;
      }
    });
  }

  get filteredRooms(): RoomResponse[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.rooms.filter((room) => {
      const matchesSearch =
        !search ||
        room.roomNumber.toLowerCase().includes(search) ||
        room.roomTypeName.toLowerCase().includes(search) ||
        room.id.toLowerCase().includes(search);
      const matchesStatus =
        this.statusFilter === 'ALL' || room.status === this.statusFilter;
      const matchesType =
        this.typeFilter === 'ALL' || room.roomTypeId === this.typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRooms.length / this.pageSize));
  }

  get paginatedRooms(): RoomResponse[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredRooms.slice(startIndex, startIndex + this.pageSize);
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

  onFilterChange(): void {
    this.currentPage = 1;
  }

  goToPage(page: number | string): void {
    if (typeof page !== 'number') return;
    this.currentPage = page;
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  openAddModal(): void {
    this.modalMode = 'add';
    this.formData = {
      roomNumber: '',
      roomTypeId: this.roomTypes[0]?.id ?? '',
      status: 'AVAILABLE',
      floor: 1
    };
    this.showModal = true;
  }

  openEditModal(room: RoomResponse): void {
    this.modalMode = 'edit';
    this.formData = {
      id: room.id,
      roomNumber: room.roomNumber,
      roomTypeId: room.roomTypeId,
      status: room.status,
      floor: room.floor
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.formData = {};
  }

  saveModal(): void {
    if (!this.formData.roomNumber?.trim() || !this.formData.roomTypeId || !this.formData.status) {
      this.showNotification('error', 'Please fill in all required fields.');
      return;
    }

    const request: RoomCreateRequest = {
      roomNumber: this.formData.roomNumber.trim(),
      roomTypeId: this.formData.roomTypeId,
      status: this.formData.status as RoomStatus,
      floor: this.formData.floor ?? 0
    };

    if (this.modalMode === 'add') {
      this.roomService.createRoom(request).subscribe({
        next: () => {
          this.showNotification('success', 'Room added successfully!');
          this.loadRooms();
          this.closeModal();
        },
        error: (error) => {
          this.showNotification('error', 'Failed to add room.');
          console.error('Error creating room:', error);
        }
      });
      return;
    }

    if (!this.formData.id) {
      this.showNotification('error', 'Missing room id for update.');
      return;
    }

    this.roomService.updateRoom(this.formData.id, request).subscribe({
      next: () => {
        this.showNotification('success', 'Room updated successfully!');
        this.loadRooms();
        this.closeModal();
      },
      error: (error) => {
        this.showNotification('error', 'Failed to update room.');
        console.error('Error updating room:', error);
      }
    });
  }

  openDeleteDialog(room: RoomResponse): void {
    this.roomToDelete = room;
    this.showDeleteDialog = true;
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog = false;
    this.roomToDelete = null;
  }

  confirmDelete(): void {
    if (!this.roomToDelete?.id) return;
    this.roomService.deleteRoom(this.roomToDelete.id).subscribe({
      next: () => {
        this.showNotification('success', `Room ${this.roomToDelete?.roomNumber} has been deleted.`);
        this.loadRooms();
        this.closeDeleteDialog();
      },
      error: (error) => {
        this.showNotification('error', 'Failed to delete room.');
        console.error('Error deleting room:', error);
        this.closeDeleteDialog();
      }
    });
  }

  displayStatus(status: RoomStatus): string {
    switch (status) {
      case 'AVAILABLE':
        return 'Available';
      case 'BOOKED':
        return 'Booked';
      case 'OCCUPIED':
        return 'Occupied';
      case 'DIRTY':
        return 'Dirty';
      case 'MAINTENANCE':
        return 'Maintenance';
      default:
        return status;
    }
  }

  statusClasses(status: RoomStatus): string {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-300';
      case 'BOOKED':
        return 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'OCCUPIED':
        return 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-300';
      case 'DIRTY':
        return 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-300';
      case 'MAINTENANCE':
        return 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-slate-50 text-slate-700 ring-slate-600/20';
    }
  }

  private syncCurrentPage(): void {
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  showNotification(type: 'success' | 'error', message: string): void {
    if (this.notifTimer) clearTimeout(this.notifTimer);
    this.notification = { type, message };
    this.notifTimer = setTimeout(() => (this.notification = null), 3500);
  }
}
