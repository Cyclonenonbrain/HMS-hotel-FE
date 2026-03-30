import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface InvoiceRecord {
  id: string;
  guestName: string;
  bookingRef: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending';
}

@Component({
  selector: 'app-staff-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-billing.component.html',
  host: {
    class: 'flex-1 flex flex-col overflow-y-auto bg-background-light text-slate-900 font-display'
  }
})
export class StaffBillingComponent implements OnInit {
  searchQuery = '';
  
  currentPage = 1;
  pageSize = 10;

  // Generate 65 mock invoices to test pagination
  invoices: InvoiceRecord[] = Array.from({length: 65}, (_, i) => {
    return {
      id: `#INV-${9400 + i}`,
      guestName: `Guest Name ${i + 1}`,
      bookingRef: `#BK-${1024 + i}`,
      amount: 150 + Math.floor(Math.random() * 2000),
      date: `Oct ${24 - (i % 20)}, 2023`,
      status: i % 4 === 0 ? 'Pending' : 'Paid'
    };
  });

  ngOnInit() {}

  get filteredInvoices(): InvoiceRecord[] {
    return this.invoices.filter(inv => {
      return inv.id.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
             inv.guestName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
             inv.bookingRef.toLowerCase().includes(this.searchQuery.toLowerCase());
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredInvoices.length / this.pageSize);
  }

  get paginatedInvoices(): InvoiceRecord[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredInvoices.slice(startIndex, startIndex + this.pageSize);
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

  onFilterChange() {
    this.currentPage = 1;
  }

  getStatusClasses(status: string) {
    if (status === 'Paid') {
      return 'bg-green-100 text-green-700';
    } else if (status === 'Pending') {
      return 'bg-yellow-100 text-yellow-800';
    }
    return '';
  }

  exportData() {
    alert('Xuất dữ liệu hóa đơn ra PDF/Excel...');
  }

  markPaid(invoice: InvoiceRecord) {
    invoice.status = 'Paid';
  }

  downloadInvoice(invoice: InvoiceRecord) {
    alert(`Đang tải hóa đơn ${invoice.id}...`);
  }
}
