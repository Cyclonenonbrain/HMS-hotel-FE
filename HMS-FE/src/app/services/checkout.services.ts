import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment'; // Đảm bảo bạn có file environment.ts với apiUrl được cấu hình đúng

/**
 * Interface khớp với ApiResponse.java từ Backend
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * DTO khớp với yêu cầu tạo Booking + Payment từ Backend
 */
export interface BookingCreateRequest {
  roomId: string;           // UUID
  checkIn: string;          // LocalDate (YYYY-MM-DD)
  checkOut: string;         // LocalDate (YYYY-MM-DD)
  numberOfGuests: number;   // Integer
  snapshotRoomPrice: number; // BigDecimal
  paymentMethod: string;    // String (VISA, MASTERCARD, etc.)
  amount: number;           // BigDecimal
  deposit?: number;         // Optional BigDecimal
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  // Base URL lấy từ config backend: http://localhost:8081/api/v1
  private readonly API_URL = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Gửi yêu cầu đặt phòng (Booking) và thanh toán (Payment)
   * Endpoint này sẽ ánh xạ tới Controller xử lý @RequestBody BookingCreateRequest
   */
  confirmBooking(payload: BookingCreateRequest): Observable<ApiResponse<any>> {
    return this.http
      .post<ApiResponse<any>>(`${this.API_URL}/customer/bookings`, payload)
      .pipe(
        retry(1), // Thử lại 1 lần nếu lỗi mạng
        catchError(this.handleError)
      );
  }

  /**
   * Probe API để kiểm tra quyền CUSTOMER (như mô tả trong mục 4.3 của README)
   */
  checkCustomerProbe(): Observable<ApiResponse<string>> {
    return this.http
      .get<ApiResponse<string>>(`${this.API_URL}/customer/probe`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Xử lý lỗi API tập trung
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Đã có lỗi xảy ra, vui lòng thử lại sau.';
    
    if (error.error instanceof ErrorEvent) {
      // Lỗi phía Client
      errorMessage = `Lỗi: ${error.error.message}`;
    } else {
      // Lỗi phía Backend (trả về ApiErrorResponse)
      if (error.status === 401) {
        errorMessage = 'Phiên làm việc hết hạn, vui lòng đăng nhập lại.';
      } else if (error.status === 403) {
        errorMessage = 'Bạn không có quyền thực hiện thao tác này.';
      } else {
        errorMessage = error.error?.message || `Mã lỗi: ${error.status}`;
      }
    }
    
    console.error('CheckoutService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}