import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { StaffInvoice, StaffInvoiceService } from '../../../core/staff-invoice.service';
import { environment } from '../../../../environment/environment';

interface BillingBookingRecord {
  bookingId: string;
  guestName: string;
  status: string;
  amount: number;
  issuedAt: string;
  invoiceId: string;
  invoiceNumber: string;
  balanceDue: number;
  isLoadingInvoice: boolean;
}

interface PrintLine {
  label: string;
  amount: number;
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
  totalPages = 1;
  totalElements = 0;
  isLoading = false;
  errorMessage = '';
  rows: BillingBookingRecord[] = [];

  detailOpen = false;
  detailLoading = false;
  detailError = '';
  selectedInvoice: StaffInvoice | null = null;
  selectedGuestName = '';
  selectedBookingId = '';

  constructor(
    private http: HttpClient,
    private staffInvoiceService: StaffInvoiceService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadRows();
  }

  loadRows() {
    this.isLoading = true;
    this.errorMessage = '';
    const params: Record<string, string | number> = {
      page: this.currentPage - 1,
      size: this.pageSize
    };
    if (this.searchQuery.trim()) params['search'] = this.searchQuery.trim();

    this.http.get<ApiResponse<any>>(`${environment.apiUrl}/bookings`, { params }).subscribe({
      next: (res) => {
        const bookings = Array.isArray(res?.data) ? res.data : (res?.data?.content ?? []);
        this.totalElements = Array.isArray(res?.data) ? bookings.length : Number(res?.data?.totalElements ?? bookings.length);
        this.totalPages = Math.max(1, Array.isArray(res?.data) ? Math.ceil(bookings.length / this.pageSize) : Number(res?.data?.totalPages ?? 1));
        this.rows = bookings.map((b: any) => ({
          bookingId: String(b?.id ?? ''),
          guestName: this.extractGuestName(b?.notes) || 'Walk-in guest',
          status: String(b?.status ?? ''),
          amount: Number(b?.snapshot_room_price ?? 0),
          issuedAt: String(b?.created_at ?? ''),
          invoiceId: '',
          invoiceNumber: '',
          balanceDue: 0,
          isLoadingInvoice: false
        }));

        this.rows.forEach((row) => {
          row.isLoadingInvoice = true;
          this.staffInvoiceService.getInvoiceByBookingId(row.bookingId)
            .pipe(finalize(() => { row.isLoadingInvoice = false; }))
            .subscribe({
              next: (invRes) => {
                const inv = invRes?.data;
                row.invoiceId = inv?.id ?? '';
                row.invoiceNumber = inv?.invoice_number ?? '';
                row.amount = Number(inv?.total_amount ?? row.amount);
                row.balanceDue = Number(inv?.balance_due ?? 0);
                row.status = String(inv?.status ?? row.status);
                row.issuedAt = String(inv?.issued_at ?? row.issuedAt);
              },
              error: (err: any) => {
                if (err?.status === 401) {
                  this.errorMessage = 'Session expired. Please login again.';
                  this.router.navigate(['/login']);
                }
              }
            });
        });
        this.isLoading = false;
      },
      error: (err: any) => {
        if (err?.status === 401) {
          this.errorMessage = 'Session expired. Please login again.';
          this.rows = [];
          this.isLoading = false;
          this.router.navigate(['/login']);
          return;
        }
        this.errorMessage = err?.error?.message || 'Failed to load billing records.';
        this.rows = [];
        this.isLoading = false;
      }
    });
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadRows();
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadRows();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadRows();
    }
  }

  markPaid(row: BillingBookingRecord) {
    if (!row.invoiceId) return;
    this.staffInvoiceService.payInvoiceManual(row.invoiceId, 'CASH')
      .pipe(finalize(() => this.loadRows()))
      .subscribe({
        error: (err: any) => {
          this.errorMessage = err?.error?.message || 'Failed to mark invoice as paid.';
        }
      });
  }

  viewInvoice(row: BillingBookingRecord) {
    if (!row.invoiceId) return;
    this.detailOpen = true;
    this.detailLoading = true;
    this.detailError = '';
    this.selectedInvoice = null;
    this.selectedGuestName = row.guestName;
    this.selectedBookingId = row.bookingId;

    this.staffInvoiceService.getInvoiceById(row.invoiceId)
      .pipe(finalize(() => { this.detailLoading = false; }))
      .subscribe({
        next: (res) => {
          this.selectedInvoice = res?.data ?? null;
          if (!this.selectedInvoice) this.detailError = 'Invoice detail is empty.';
        },
        error: (err: any) => {
          if (err?.status === 401) {
            this.detailError = 'Session expired. Please login again.';
            this.router.navigate(['/login']);
            return;
          }
          this.detailError = err?.error?.message || 'Failed to load invoice detail.';
        }
      });
  }

  closeInvoiceDetail() {
    this.detailOpen = false;
    this.detailLoading = false;
    this.detailError = '';
    this.selectedInvoice = null;
    this.selectedGuestName = '';
    this.selectedBookingId = '';
  }

  printInvoice(row: BillingBookingRecord) {
    if (!row.invoiceId) return;
    this.errorMessage = '';
    this.staffInvoiceService.getInvoiceById(row.invoiceId).subscribe({
      next: (res) => {
        const invoice = res?.data ?? null;
        if (!invoice) {
          this.errorMessage = 'Invoice not found for this booking.';
          return;
        }
        this.printFormattedInvoice(invoice, row.bookingId, row.guestName);
      },
      error: (err: any) => {
        if (err?.status === 401) {
          this.errorMessage = 'Session expired. Please login again.';
          this.router.navigate(['/login']);
          return;
        }
        this.errorMessage = err?.error?.message || 'Failed to load invoice for printing.';
      }
    });
  }

  getStatusClasses(status: string) {
    const s = (status || '').toUpperCase();
    if (s === 'PAID') return 'bg-green-100 text-green-700';
    if (s === 'ISSUED' || s === 'PARTIALLY_PAID' || s === 'DRAFT') return 'bg-yellow-100 text-yellow-800';
    return 'bg-slate-100 text-slate-700';
  }

  get roomItems() {
    const items = this.selectedInvoice?.invoice_items ?? [];
    return items.filter((it: any) => !it.booking_service_id && String(it.item_type || '').toUpperCase() === 'ROOM');
  }

  get serviceItems() {
    const items = this.selectedInvoice?.invoice_items ?? [];
    return items.filter((it: any) => !!it.booking_service_id || String(it.item_type || '').toUpperCase() === 'SERVICE');
  }

  private extractGuestName(notes: string | null | undefined): string {
    if (!notes) return '';
    const part = notes.split('|').map((x) => x.trim()).find((x) => x.startsWith('Guest:'));
    return part ? part.replace('Guest:', '').trim() : '';
  }

  private printFormattedInvoice(invoice: StaffInvoice, bookingId: string, guestName: string) {
    const w = window.open('', '_blank', 'width=900,height=1000');
    if (!w) {
      this.errorMessage = 'Cannot open print window. Please allow pop-ups.';
      return;
    }

    const items = Array.isArray(invoice.invoice_items) ? invoice.invoice_items : [];
    const rooms = items.filter((it: any) => !it.booking_service_id && String(it.item_type || '').toUpperCase() === 'ROOM');
    const services = items.filter((it: any) => !!it.booking_service_id || String(it.item_type || '').toUpperCase() === 'SERVICE');

    const roomLines: PrintLine[] = rooms.map((it: any) => {
      const roomLabel = it.room_number ? `Room ${it.room_number}` : (it.description || 'Room');
      const roomType = it.room_type_name ? ` (${it.room_type_name})` : '';
      const nights = Number(it.nights ?? it.quantity ?? 0);
      return {
        label: `${roomLabel}${roomType}\n  ${nights} nights x ${Number(it.unit_price || 0).toLocaleString('vi-VN')}`,
        amount: Number(it.line_total || 0)
      };
    });

    const serviceLines: PrintLine[] = services.map((it: any) => ({
      label: `${it.service_name || it.description || 'Service'} (x${it.quantity || 0})`,
      amount: Number(it.line_total || 0)
    }));

    const fmt = (n: number) => Number(n || 0).toLocaleString('vi-VN');
    const line = (left: string, right: string) => {
      const max = 40;
      const l = left.length > max ? left.slice(0, max) : left;
      const spaces = ' '.repeat(Math.max(1, 40 - l.length - right.length));
      return `${l}${spaces}${right}`;
    };
    const section = (title: string, lines: PrintLine[]) => {
      const body = lines.length
        ? lines.map((x) => {
            const split = x.label.split('\n');
            const first = line(split[0], fmt(x.amount));
            if (split.length === 1) return first;
            return `${first}\n${split.slice(1).join('\n')}`;
          }).join('\n\n')
        : '(None)';
      return `----------------------------------------\n${title}\n----------------------------------------\n${body}\n`;
    };

    const issuedDate = invoice.issued_at || invoice.created_at || new Date().toISOString();
    const text = [
      '========================================',
      '           LUXECORE HOTEL',
      '        123 Nguyen Van A, HCM',
      '        Hotline: 0123 456 789',
      '========================================',
      '',
      `Invoice ID: ${invoice.invoice_number || invoice.id}`,
      `Booking ID: ${bookingId}`,
      `Date: ${new Date(issuedDate).toLocaleString('vi-VN')}`,
      '',
      `Guest: ${guestName || 'Walk-in guest'}`,
      '',
      section('ROOM CHARGES', roomLines).trimEnd(),
      '',
      section('SERVICES', serviceLines).trimEnd(),
      '',
      '----------------------------------------',
      'SUMMARY',
      '----------------------------------------',
      line('Room Total:', fmt(Number(invoice.subtotal_room || 0))),
      line('Service Total:', fmt(Number(invoice.subtotal_service || 0))),
      '----------------------------------------',
      line('GRAND TOTAL:', fmt(Number(invoice.total_amount || 0))),
      '----------------------------------------',
      '',
      `Payment Method: ${invoice.balance_due > 0 ? 'UNPAID' : 'CASH'}`,
      '',
      'Thank you for staying with us!',
      '========================================'
    ].join('\n');

    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    w.document.write(`<html><head><title>Invoice</title><style>@media print{body{margin:0}.no-print{display:none}}</style></head><body><pre style="font-family: Consolas, monospace; font-size:14px; padding:16px;">${escaped}</pre></body></html>`);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }
}
