import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { ApiResponse } from './models/api-response.model';

export interface StaffInvoiceItem {
  id: string;
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
  booking_id: string;
  invoice_number: string;
  status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'REFUNDED';
  subtotal_room: number;
  subtotal_service: number;
  surcharge_amount: number;
  discount_amount: number;
  deposit_applied: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  issued_at: string | null;
  paid_at: string | null;
  created_at: string;
  invoice_items: StaffInvoiceItem[];
}

@Injectable({
  providedIn: 'root'
})
export class StaffInvoiceService {
  private readonly API_URL = `${environment.apiUrl}/invoices`;
  private readonly API_URL_LEGACY = `${environment.apiUrl}/invoice`;

  constructor(private http: HttpClient) {}

  getInvoiceById(invoiceId: string): Observable<ApiResponse<StaffInvoice>> {
    return this.http
      .get<ApiResponse<StaffInvoice>>(`${this.API_URL}/${invoiceId}`)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            return this.http.get<ApiResponse<StaffInvoice>>(`${this.API_URL_LEGACY}/${invoiceId}`);
          }
          return throwError(() => err);
        })
      );
  }

  getInvoiceByBookingId(bookingId: string): Observable<ApiResponse<StaffInvoice>> {
    return this.http
      .get<ApiResponse<StaffInvoice>>(`${this.API_URL}/by-booking/${bookingId}`)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            return this.http.get<ApiResponse<StaffInvoice>>(`${this.API_URL_LEGACY}/by-booking/${bookingId}`);
          }
          return throwError(() => err);
        })
      );
  }

  payInvoiceManual(invoiceId: string, provider: 'CASH' | 'BANK_TRANSFER' | 'OTHER', reference?: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/${invoiceId}/payment-transactions/manual`, {
      provider,
      reference: reference || null
    });
  }
}

