import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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
 * Booking Item Request - khớp với BookingItemRequest DTO từ Backend
 */
export interface BookingItemRequest {
  room_type_id: string;           // UUID
  check_in: string;               // LocalDate (YYYY-MM-DD)
  check_out: string;              // LocalDate (YYYY-MM-DD)
  number_of_guests: number;       // Integer
  pricing_mode?: string;          // Optional: NIGHTLY, HOURLY
}

/**
 * DTO khớp với BookingCreateRequest từ Backend
 */
export interface BookingCreateRequest {
  channel: 'WEB' | 'COUNTER' | 'ADMIN';
  deposit: number;                // BigDecimal - tổng tiền cọc (có thể = totalAmount)
  notes?: string;                 // Optional notes
  coupon_code?: string;           // Optional coupon code
  booking_items: BookingItemRequest[];
}

/**
 * Booking Response từ Backend
 */
export interface BookingResponse {
  id: string;                     // UUID
  user_id: string;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  channel: string;
  deposit: number;
  coupon_code_snapshot?: string;
  discount_snapshot?: number;
  booking_items: BookingItemResponse[];
  created_at: string;
  updated_at: string;
}

export interface BookingItemResponse {
  id: string;
  room_type_id: string;
  room_type_name: string;
  check_in: string;
  check_out: string;
  number_of_guests: number;
  snapshot_price: number;
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private readonly API_URL = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Tạo booking mới
   * POST /api/v1/bookings
   */
  createBooking(payload: BookingCreateRequest): Observable<ApiResponse<BookingResponse>> {
    return this.http
      .post<ApiResponse<BookingResponse>>(`${this.API_URL}/bookings`, payload)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  /**
   * Lấy thông tin booking theo ID
   * GET /api/v1/bookings/{id}
   */
  getBookingById(bookingId: string): Observable<ApiResponse<BookingResponse>> {
    return this.http
      .get<ApiResponse<BookingResponse>>(`${this.API_URL}/bookings/${bookingId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Lấy danh sách bookings của user hiện tại
   * GET /api/v1/bookings
   */
  getMyBookings(): Observable<ApiResponse<BookingResponse[]>> {
    return this.http
      .get<ApiResponse<BookingResponse[]>>(`${this.API_URL}/bookings`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Xử lý lỗi API tập trung
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Đã có lỗi xảy ra, vui lòng thử lại sau.';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Lỗi: ${error.error.message}`;
    } else {
      if (error.status === 401) {
        errorMessage = 'Phiên làm việc hết hạn, vui lòng đăng nhập lại.';
      } else if (error.status === 403) {
        errorMessage = 'Bạn không có quyền thực hiện thao tác này.';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Dữ liệu không hợp lệ.';
      } else if (error.status === 409) {
        errorMessage = error.error?.message || 'Phòng đã được đặt trong khoảng thời gian này.';
      } else {
        errorMessage = error.error?.message || `Mã lỗi: ${error.status}`;
      }
    }
    
    console.error('CheckoutService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}