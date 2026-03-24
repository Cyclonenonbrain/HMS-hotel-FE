import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface BookingRecord {
  id: string;
  guestInitials: string;
  guestName: string;
  room: string;
  checkIn: string;
  checkOut: string;
  status: 'Checked In' | 'Confirmed' | 'Pending';
}

@Component({
  selector: 'app-staff-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-bookings.component.html',
  host: {
    class: 'flex-1 flex flex-col overflow-y-auto bg-background-light text-slate-900 font-display'
  }
})
export class StaffBookingsComponent implements OnInit {
  searchQuery = '';
  activeStatus = 'all';

  currentPage = 1;
  pageSize = 10;

  // Generate 65 mock bookings to test pagination
  bookings: BookingRecord[] = Array.from({length: 65}, (_, i) => {
    const statuses: ('Checked In' | 'Confirmed' | 'Pending')[] = ['Checked In', 'Confirmed', 'Pending'];
    return {
      id: `#BK-${1024 + i}`,
      guestInitials: `G${i % 10}`,
      guestName: `Guest Name ${i + 1}`,
      room: `Room ${101 + (i % 30)}`,
      checkIn: `1${(i % 5) + 2} Oct 2023`,
      checkOut: `1${(i % 5) + 5} Oct 2023`,
      status: statuses[i % 3]
    };
  });

  ngOnInit() {}

  get filteredBookings(): BookingRecord[] {
    return this.bookings.filter(b => {
      const matchesSearch = b.id.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                            b.guestName.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      let matchesStatus = true;
      if (this.activeStatus !== 'all') {
        const statusMap: any = {
          'checked-in': 'Checked In',
          'confirmed': 'Confirmed',
          'pending': 'Pending'
        };
        matchesStatus = b.status === statusMap[this.activeStatus];
      }
      return matchesSearch && matchesStatus;
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredBookings.length / this.pageSize);
  }

  get paginatedBookings(): BookingRecord[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredBookings.slice(startIndex, startIndex + this.pageSize);
  }

  get visiblePages(): (number | string)[] {
    const total = this.totalPages;
    if (total <= 6) {
      return Array.from({length: total}, (_, i) => i + 1);
    }

    const arr: (number | string)[] = [1, 2, 3];

    // Left dots
    if (this.currentPage > 4) {
      arr.push('...');
    }

    // Mid current page
    if (this.currentPage > 3 && this.currentPage < total - 2) {
      arr.push(this.currentPage);
    }

    // Right dots
    if (this.currentPage < total - 3) {
      arr.push('...');
    }

    // End pages
    arr.push(total - 2, total - 1, total);

    return arr;
  }

  goToPage(page: number | string) {
    if (typeof page === 'number') {
      this.currentPage = page;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  // Handle when filters change - reset page
  onFilterChange() {
    this.currentPage = 1;
  }

  getStatusClasses(status: string) {
    if (status === 'Checked In') {
      return 'bg-green-50 text-green-700 ring-green-600/20';
    } else if (status === 'Confirmed') {
      return 'bg-blue-50 text-blue-700 ring-blue-700/10';
    } else if (status === 'Pending') {
      return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
    }
    return '';
  }

  newBooking() {
    alert('Khởi tạo giao diện New Booking...');
  }
}
