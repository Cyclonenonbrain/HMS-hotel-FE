import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * PayOS Payment Link Response
 */
export interface PayOsPaymentLinkResponse {
  checkout_url: string;       // URL để redirect user tới PayOS
  qr_code?: string;           // QR code payload (optional)
  payment_id: string;         // Payment UUID
  order_code: string;         // PayOS order code
  amount: number;             // Số tiền thanh toán
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly API_URL = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Tạo PayOS payment link cho booking
   * POST /api/v1/bookings/{bookingId}/payment-links/payos
   */
  createPayOsPaymentLink(bookingId: string): Observable<ApiResponse<PayOsPaymentLinkResponse>> {
    return this.http
      .post<ApiResponse<PayOsPaymentLinkResponse>>(
        `${this.API_URL}/bookings/${bookingId}/payment-links/payos`,
        {}
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Kiểm tra trạng thái payment
   * GET /api/v1/payments/{paymentId}
   */
  getPaymentStatus(paymentId: string): Observable<ApiResponse<any>> {
    return this.http
      .get<ApiResponse<any>>(`${this.API_URL}/payments/${paymentId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Xử lý lỗi API
   */
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
        errorMessage = 'Không tìm thấy booking.';
      } else {
        errorMessage = error.error?.message || `Lỗi thanh toán: ${error.status}`;
      }
    }
    
    console.error('PaymentService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
