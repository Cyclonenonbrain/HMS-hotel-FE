import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, map } from 'rxjs';
import { BookingService } from '../../../services/booking.services';
import { ApiResponse } from '../../../core/models/api-response.model';
import { HotelServiceResponse } from '../../../core/models/hotel-service.model';
import { StaffInvoice, StaffInvoiceService } from '../../../core/staff-invoice.service';
import { environment } from '../../../../environment/environment';

interface BookingItemRecord {
  id: string;
  roomTypeName: string;
  roomNumber: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
}

interface BookingRecord {
  id: string;
  guestInitials: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  rawStatus: string;
  roomTypeSummary: string;
  roomSummary: string;
  bookingItems: BookingItemRecord[];
  actionLoading: boolean;
  actionError: string;
}

interface ServiceUsageResponse {
  id: string;
  booking_id: string;
  service_id: string;
  service_name: string;
  quantity: number;
  snapshot_price: number;
  line_total: number;
  created_at: string;
}

interface PrintLine {
  label: string;
  amount: number;
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
  totalPages = 1;
  totalElements = 0;
  isLoading = false;
  errorMessage = '';
  isServerPaged = true;

  bookings: BookingRecord[] = [];
  serviceModalOpen = false;
  serviceModalLoading = false;
  serviceModalError = '';
  selectedBookingId: string | null = null;
  selectedBookingTitle = '';
  selectedBookingRawStatus = '';
  usages: ServiceUsageResponse[] = [];
  activeServices: HotelServiceResponse[] = [];
  serviceSearch = '';
  deletingServiceUsageId: string | null = null;
  serviceForm = {
    serviceId: '',
    quantity: 1
  };
  checkoutModalOpen = false;
  checkoutModalLoading = false;
  checkoutError = '';
  checkoutBookingId: string | null = null;
  checkoutBookingTitle = '';
  checkoutInvoice: StaffInvoice | null = null;
  checkoutPaying = false;

  constructor(
    private bookingService: BookingService,
    private staffInvoiceService: StaffInvoiceService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadBookings();
  }

  loadBookings() {
    this.isLoading = true;
    this.errorMessage = '';
    const query: Record<string, string | number> = {
      page: this.currentPage - 1,
      size: this.pageSize
    };
    if (this.activeStatus !== 'all') {
      query['status'] = this.activeStatus.toUpperCase().replace('-', '_');
    }
    const q = this.searchQuery.trim();
    if (q) query['search'] = q;

    this.bookingService.getBookings(query).subscribe({
      next: (res) => {
        const page = this.extractBookingPage(res?.data);
        this.isServerPaged = page.isServerPaged;
        this.totalPages = page.totalPages;
        this.totalElements = page.totalElements;
        const records = page.content.map((bookingRaw: any) => this.mapBookingRecord(bookingRaw));
        if (this.isServerPaged) {
          this.bookings = records;
        } else {
          const start = (this.currentPage - 1) * this.pageSize;
          this.bookings = records.slice(start, start + this.pageSize);
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        this.errorMessage = err?.error?.message || 'Failed to load bookings.';
        this.bookings = [];
        this.totalPages = 1;
        this.totalElements = 0;
        this.isLoading = false;
      }
    });
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadBookings();
  }

  goToPage(page: number | string) {
    if (typeof page !== 'number') return;
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.loadBookings();
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadBookings();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadBookings();
    }
  }

  get visiblePages(): (number | string)[] {
    const total = this.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const arr: (number | string)[] = [1];
    if (this.currentPage > 3) arr.push('...');
    const start = Math.max(2, this.currentPage - 1);
    const end = Math.min(total - 1, this.currentPage + 1);
    for (let p = start; p <= end; p++) arr.push(p);
    if (this.currentPage < total - 2) arr.push('...');
    arr.push(total);
    return arr;
  }

  canCheckIn(record: BookingRecord): boolean {
    return record.rawStatus === 'PENDING' || record.rawStatus === 'CONFIRMED';
  }

  isCheckedIn(record: BookingRecord): boolean {
    return record.rawStatus === 'CHECKED_IN';
  }

  isFinalState(record: BookingRecord): boolean {
    return record.rawStatus === 'COMPLETED' || record.rawStatus === 'CANCELLED';
  }

  toggleCheckInOut(record: BookingRecord) {
    if (record.actionLoading) return;
    if (this.isCheckedIn(record)) {
      this.openCheckoutModal(record);
      return;
    }
    this.checkIn(record);
  }

  cancelBooking(record: BookingRecord) {
    if (record.actionLoading) return;
    if (record.rawStatus === 'COMPLETED' || record.rawStatus === 'CANCELLED') return;
    record.actionLoading = true;
    record.actionError = '';
    this.bookingService.updateBookingStatus(record.id, { status: 'CANCELLED' })
      .pipe(finalize(() => {
        record.actionLoading = false;
      }))
      .subscribe({
        next: () => this.loadBookings(),
        error: (err: any) => {
          record.actionError = err?.error?.message || 'Cannot cancel this booking.';
        }
      });
  }

  openServiceModal(record: BookingRecord) {
    this.serviceModalOpen = true;
    this.serviceModalLoading = true;
    this.serviceModalError = '';
    this.selectedBookingId = record.id;
    this.selectedBookingRawStatus = record.rawStatus;
    this.selectedBookingTitle = `${record.id} - ${record.guestName}`;
    this.usages = [];
    this.serviceForm = { serviceId: '', quantity: 1 };

    const bookingServices$ = this.http.get<ApiResponse<ServiceUsageResponse[]>>(
      `${environment.apiUrl}/bookings/${record.id}/booking-services`
    );
    const services$ = this.loadActiveServices();

    bookingServices$.subscribe({
      next: (res) => {
        this.usages = res?.data ?? [];
      },
      error: () => {
        this.serviceModalError = this.serviceModalError || 'Failed to load booking services.';
      }
    });

    services$.subscribe({
      next: (services) => {
        this.activeServices = services;
        this.serviceForm.serviceId = this.activeServices[0]?.id ?? '';
        this.serviceModalLoading = false;
      },
      error: () => {
        this.serviceModalError = this.serviceModalError || 'Failed to load service catalog.';
        this.serviceModalLoading = false;
      }
    });
  }

  closeServiceModal() {
    this.serviceModalOpen = false;
  }

  addServiceUsage() {
    if (!this.serviceForm.serviceId || this.serviceForm.quantity < 1) {
      this.serviceModalError = 'Please select service and valid quantity.';
      return;
    }
    if (this.selectedBookingRawStatus !== 'CHECKED_IN') {
      this.serviceModalError = 'Booking must be checked-in before adding services.';
      return;
    }
    this.serviceModalError = '';
    this.http.post<ApiResponse<ServiceUsageResponse>>(
      `${environment.apiUrl}/bookings/${this.selectedBookingId}/booking-services`,
      {
        service_id: this.serviceForm.serviceId,
        quantity: this.serviceForm.quantity
      }
    ).subscribe({
      next: (res) => {
        if (res?.data) {
          this.usages = [...this.usages, res.data];
          this.serviceForm.quantity = 1;
        }
      },
      error: (err: any) => {
        this.serviceModalError = err?.error?.message || 'Failed to add service usage.';
      }
    });
  }

  get totalServiceAmount(): number {
    return this.usages.reduce((sum, usage) => sum + Number(usage.line_total || 0), 0);
  }

  deleteServiceUsage(usageId: string) {
    if (!this.selectedBookingId || this.deletingServiceUsageId) return;
    this.deletingServiceUsageId = usageId;
    this.serviceModalError = '';
    this.http.delete<ApiResponse<void>>(
      `${environment.apiUrl}/bookings/${this.selectedBookingId}/booking-services/${usageId}`
    ).pipe(finalize(() => {
      this.deletingServiceUsageId = null;
    })).subscribe({
      next: () => {
        this.usages = this.usages.filter((u) => u.id !== usageId);
      },
      error: (err: any) => {
        this.serviceModalError = err?.error?.message || 'Failed to delete service usage.';
      }
    });
  }

  get filteredServices(): HotelServiceResponse[] {
    const q = this.serviceSearch.trim().toLowerCase();
    if (!q) return this.activeServices;
    return this.activeServices.filter((s) => s.name.toLowerCase().includes(q));
  }

  selectService(serviceId: string) {
    this.serviceForm.serviceId = serviceId;
  }

  private loadActiveServices(): Observable<HotelServiceResponse[]> {
    const endpoint = `${environment.apiUrl}/staff/services`;
    const params = {
      is_active: true,
      page: 0,
      size: 200,
      sort: 'name,asc'
    };
    return this.http.get<ApiResponse<any>>(endpoint, { params }).pipe(
      map((res) => this.mapServicesPayload(res?.data))
    );
  }

  private mapServicesPayload(data: any): HotelServiceResponse[] {
    const list = Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []);
    return list.map((item: any) => ({
      id: String(item?.id ?? ''),
      name: String(item?.name ?? ''),
      price: Number(item?.price ?? 0),
      isActive: Boolean(item?.isActive ?? item?.is_active ?? true)
    })).filter((s: HotelServiceResponse) => !!s.id && !!s.name);
  }

  getStatusClasses(status: string) {
    if (status === 'Checked In') return 'bg-green-50 text-green-700 ring-green-600/20';
    if (status === 'Confirmed') return 'bg-blue-50 text-blue-700 ring-blue-700/10';
    if (status === 'Pending') return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
    if (status === 'Completed') return 'bg-slate-100 text-slate-700 ring-slate-500/20';
    if (status === 'Cancelled') return 'bg-rose-50 text-rose-700 ring-rose-600/20';
    return 'bg-slate-100 text-slate-700 ring-slate-500/20';
  }

  private checkIn(record: BookingRecord) {
    if (!this.canCheckIn(record)) return;
    const assignments = record.bookingItems
      .filter((item) => item.id && item.roomId)
      .map((item) => ({
        booking_item_id: item.id,
        room_id: item.roomId,
        notes: 'Checked in from staff bookings page'
      }));
    if (assignments.length === 0) {
      record.actionError = 'Booking chưa có room cụ thể để check-in.';
      return;
    }

    record.actionLoading = true;
    record.actionError = '';
    const runCheckIn = () => {
      this.bookingService.checkInBooking(record.id, { room_assignments: assignments })
        .pipe(finalize(() => {
          record.actionLoading = false;
        }))
        .subscribe({
          next: () => this.loadBookings(),
          error: (err: any) => {
            record.actionError = err?.error?.message || 'Cannot check in this booking.';
          }
        });
    };

    if (record.rawStatus === 'PENDING') {
      this.bookingService.updateBookingStatus(record.id, { status: 'CONFIRMED' }).subscribe({
        next: () => runCheckIn(),
        error: (err: any) => {
          record.actionLoading = false;
          record.actionError = err?.error?.message || 'Cannot confirm this booking before check-in.';
        }
      });
      return;
    }

    runCheckIn();
  }

  openCheckoutModal(record: BookingRecord) {
    this.checkoutModalOpen = true;
    this.checkoutModalLoading = true;
    this.checkoutError = '';
    this.checkoutInvoice = null;
    this.checkoutBookingId = record.id;
    this.checkoutBookingTitle = `${record.id} - ${record.guestName}`;

    this.staffInvoiceService.getInvoiceByBookingId(record.id).subscribe({
      next: (res) => {
        this.checkoutInvoice = res?.data ?? null;
        this.checkoutModalLoading = false;
      },
      error: (err: any) => {
        this.checkoutError = err?.error?.message || 'Failed to load invoice for checkout.';
        this.checkoutModalLoading = false;
      }
    });
  }

  closeCheckoutModal() {
    this.checkoutModalOpen = false;
  }

  confirmCheckout() {
    if (!this.checkoutBookingId || !this.checkoutInvoice) return;
    if (Number(this.checkoutInvoice.balance_due || 0) > 0) {
      this.checkoutError = 'Please settle invoice before checkout.';
      return;
    }

    this.checkoutPaying = true;
    this.checkoutError = '';
    this.bookingService.checkOutBooking(this.checkoutBookingId)
      .pipe(finalize(() => {
        this.checkoutPaying = false;
      }))
      .subscribe({
        next: () => {
          this.closeCheckoutModal();
          this.loadBookings();
        },
        error: (err: any) => {
          this.checkoutError = err?.error?.message || 'Checkout failed.';
        }
      });
  }

  markInvoicePaidForCheckout() {
    if (!this.checkoutInvoice) return;
    this.checkoutPaying = true;
    this.checkoutError = '';
    this.staffInvoiceService.payInvoiceManual(this.checkoutInvoice.id, 'CASH')
      .pipe(finalize(() => {
        this.checkoutPaying = false;
      }))
      .subscribe({
        next: () => {
          if (!this.checkoutBookingId) return;
          this.staffInvoiceService.getInvoiceByBookingId(this.checkoutBookingId).subscribe({
            next: (res) => {
              this.checkoutInvoice = res?.data ?? this.checkoutInvoice;
            },
            error: () => {}
          });
        },
        error: (err: any) => {
          this.checkoutError = err?.error?.message || 'Failed to mark invoice as paid.';
        }
      });
  }

  printCheckoutInvoice() {
    if (!this.checkoutInvoice || !this.checkoutBookingId) return;
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) return;

    const invoice = this.checkoutInvoice;
    const items = Array.isArray(invoice.invoice_items) ? invoice.invoice_items : [];
    const rooms = items.filter((it: any) => !it.booking_service_id && String(it.item_type || '').toUpperCase() === 'ROOM');
    const services = items.filter((it: any) => !!it.booking_service_id || String(it.item_type || '').toUpperCase() === 'SERVICE');

    const roomLines: PrintLine[] = rooms.map((it: any) => ({
      label: `${it.description || 'Room'} (x${it.quantity || 0})`,
      amount: Number(it.line_total || 0)
    }));
    const serviceLines: PrintLine[] = services.map((it: any) => ({
      label: `${it.description || 'Service'} (x${it.quantity || 0})`,
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
        ? lines.map((x) => line(x.label, fmt(x.amount))).join('\n')
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
      `Booking ID: ${this.checkoutBookingId}`,
      `Date: ${new Date(issuedDate).toLocaleString('vi-VN')}`,
      '',
      `Guest: ${this.checkoutBookingTitle.split(' - ')[1] || 'Walk-in guest'}`,
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
    w.document.write(`<html><head><title>Invoice</title></head><body><pre style="font-family: Consolas, monospace; font-size:14px;">${escaped}</pre></body></html>`);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }

  private mapBookingRecord(b: any): BookingRecord {
    const itemsRaw = Array.isArray(b?.booking_items) ? b.booking_items : [];
    const items: BookingItemRecord[] = itemsRaw.map((item: any) => ({
      id: String(item?.id ?? ''),
      roomTypeName: String(item?.room_type_name ?? 'Unknown type'),
      roomNumber: String(item?.room_number ?? item?.room_id ?? '-'),
      roomId: String(item?.room_id ?? ''),
      checkIn: String(item?.check_in ?? ''),
      checkOut: String(item?.check_out ?? '')
    }));
    const first = items[0];
    const guestName = this.extractGuestName(b?.notes) || 'Walk-in guest';
    const rawStatus = String(b?.status || '').toUpperCase();
    return {
      id: String(b?.id ?? ''),
      guestInitials: this.toInitials(guestName),
      guestName,
      checkIn: first?.checkIn ?? '',
      checkOut: first?.checkOut ?? '',
      status: this.humanStatus(rawStatus),
      rawStatus,
      roomTypeSummary: this.uniqueJoin(items.map((item) => item.roomTypeName)),
      roomSummary: this.uniqueJoin(items.map((item) => item.roomNumber)),
      bookingItems: items,
      actionLoading: false,
      actionError: ''
    };
  }

  private uniqueJoin(values: string[]): string {
    return Array.from(new Set(values.filter(Boolean))).join(', ');
  }

  private extractBookingPage(raw: unknown): { content: any[]; totalElements: number; totalPages: number; isServerPaged: boolean } {
    if (Array.isArray(raw)) {
      const total = raw.length;
      return {
        content: raw,
        totalElements: total,
        totalPages: Math.max(1, Math.ceil(total / this.pageSize)),
        isServerPaged: false
      };
    }
    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      const content = Array.isArray(obj['content']) ? (obj['content'] as any[]) : [];
      const totalElements = Number(obj['totalElements'] ?? content.length);
      const totalPages = Math.max(1, Number(obj['totalPages'] ?? 1));
      const hasPageMeta = 'totalElements' in obj || 'totalPages' in obj || 'pageable' in obj;
      return { content, totalElements, totalPages, isServerPaged: hasPageMeta };
    }
    return { content: [], totalElements: 0, totalPages: 1, isServerPaged: false };
  }

  private extractGuestName(notes: string | null | undefined): string {
    if (!notes) return '';
    const part = notes.split('|').map((x) => x.trim()).find((x) => x.startsWith('Guest:'));
    return part ? part.replace('Guest:', '').trim() : '';
  }

  private toInitials(name: string): string {
    const parts = name.split(' ').filter(Boolean).slice(0, 2);
    return (parts.map((p) => p[0]?.toUpperCase()).join('') || 'GU');
  }

  private humanStatus(status: string): string {
    if (status === 'CHECKED_IN') return 'Checked In';
    if (status === 'CONFIRMED') return 'Confirmed';
    if (status === 'COMPLETED') return 'Completed';
    if (status === 'CANCELLED') return 'Cancelled';
    return 'Pending';
  }
}

