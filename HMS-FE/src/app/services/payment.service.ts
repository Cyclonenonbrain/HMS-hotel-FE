import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface PayOsPaymentLinkResponse {
  checkout_url?: string;
  checkoutUrl?: string;
  qr_code?: string;
  qrCode?: string;
  payment_id?: string | number;
  paymentId?: string | number;
  order_code?: string | number;
  orderCode?: string | number;
  amount?: number;
}

export interface ApiResponse<T> {
  code?: string;
  success?: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly API_URL = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Tạo PayOS payment link cho booking theo publicCode
   * POST /api/v1/bookings/me/{publicCode}/payments/payos (User đã đăng nhập)
   * POST /api/v1/bookings/lookup/{publicCode}/payments/payos (Khách vãng lai với X-Booking-Token)
   */
  createPayOsPaymentLink(publicCode: string, bookingToken?: string): Observable<ApiResponse<PayOsPaymentLinkResponse>> {
    const token = localStorage.getItem('access_token');
    if (token) {
      return this.http
        .post<ApiResponse<PayOsPaymentLinkResponse>>(
          `${this.API_URL}/bookings/me/${publicCode}/payments/payos`,
          {}
        )
        .pipe(catchError(this.handleError));
    }

    let headers = new HttpHeaders();
    if (bookingToken) {
      headers = headers.set('X-Booking-Token', bookingToken);
    }

    return this.http
      .post<ApiResponse<PayOsPaymentLinkResponse>>(
        `${this.API_URL}/bookings/lookup/${publicCode}/payments/payos`,
        {},
        { headers }
      )
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Đã có lỗi xảy ra khi tạo thanh toán.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Lỗi: ${error.error.message}`;
    } else {
      if (error.status === 400) {
        errorMessage = error.error?.message || 'Không thể tạo link thanh toán. Vui lòng thử lại.';
      } else if (error.status === 401) {
        errorMessage = 'Phiên làm việc hết hạn, vui lòng đăng nhập lại.';
      } else if (error.status === 403) {
        errorMessage = 'Bạn không có quyền thực hiện thanh toán này.';
      } else if (error.status === 404) {
        errorMessage = 'Không tìm thấy thông tin đặt phòng.';
      } else {
        errorMessage = error.error?.message || `Lỗi thanh toán: ${error.status}`;
      }
    }
    console.error('PaymentService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
