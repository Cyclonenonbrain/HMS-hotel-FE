import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { ApiResponse } from './models/api-response.model';

export interface StaffInvoiceItem {
  id?: string;
  description: string;
  item_type?: 'ROOM' | 'SERVICE' | string;
  room_number?: string | null;
  room_type_name?: string | null;
  booking_service_id?: string | null;
  service_name?: string | null;
  nights?: number | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface StaffInvoice {
  id: string;
  booking_id?: string;
  bookingPublicCode?: string;
  invoice_number?: string;
  status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'REFUNDED' | string;
  subtotal_room?: number;
  subtotal_service?: number;
  surcharge_amount?: number;
  discount_amount?: number;
  deposit_applied?: number;
  total_amount?: number;
  paid_amount?: number;
  balance_due: number;
  issued_at?: string | null;
  paid_at?: string | null;
  created_at?: string;
  invoice_items?: StaffInvoiceItem[];
  payments?: Array<{
    id: number | string;
    amount: number;
    provider: string;
    status: string;
    createdAt: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class StaffInvoiceService {
  private readonly API_URL = `${environment.apiUrl}/staff`;

  constructor(private http: HttpClient) {}

  getInvoiceById(invoiceId: string | number): Observable<ApiResponse<StaffInvoice>> {
    return this.http
      .get<ApiResponse<StaffInvoice>>(`${this.API_URL}/invoices/${invoiceId}`)
      .pipe(catchError(this.handleError));
  }

  getInvoiceByBookingCode(publicCode: string): Observable<ApiResponse<StaffInvoice>> {
    return this.http
      .get<ApiResponse<StaffInvoice>>(`${this.API_URL}/bookings/${publicCode}/invoice`)
      .pipe(catchError(this.handleError));
  }

  getInvoiceByBookingId(bookingId: string): Observable<ApiResponse<StaffInvoice>> {
    return this.getInvoiceByBookingCode(bookingId);
  }

  payInvoiceManual(
    invoiceId: string | number,
    provider: 'CASH' | 'BANK_TRANSFER' | 'OTHER' = 'CASH',
    reference?: string,
    amount?: number
  ): Observable<ApiResponse<any>> {
    const payload = {
      amount: amount || undefined,
      provider: provider,
      reference: reference || null
    };
    return this.http
      .post<ApiResponse<any>>(`${this.API_URL}/invoices/${invoiceId}/payments`, payload)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('StaffInvoiceService Error:', error);
    return throwError(() => error);
  }
}
