import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ApiResponse<T> {
  code?: string;
  success?: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

export interface HoldLineRequest {
  roomTypeId: number;
  guests: number;
  quantity: number;
}

export interface HoldCreateRequest {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  lines: HoldLineRequest[];
}

export interface HoldResponse {
  accessToken: string;
  hotelId: number;
  status: string;
  checkIn: string;
  checkOut: string;
  expiresAt: string;
  lines: Array<{
    roomTypeId: number;
    roomTypeName: string;
    guests: number;
    quantity: number;
    roomSubtotal: number;
    discountAmount: number;
    surchargeAmount: number;
    totalAmount: number;
  }>;
}

export interface HoldConversionRequest {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  couponValidationToken?: string;
}

export interface BookingDetailResponse {
  publicCode: string;
  hotelId: number;
  hotelName: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  totalAmount: number;
  couponSnapshot?: {
    code: string;
    discountAmount: number;
  };
  items: Array<{
    roomTypeId: number;
    roomTypeName: string;
    checkInDate: string;
    checkOutDate: string;
    actualGuests: number;
    quantity: number;
    totalAmount: number;
  }>;
  roomAssignments?: Array<{
    roomTypeId: number;
    roomNumber: string;
  }>;
}

export type BookingResponse = BookingDetailResponse;

export interface BookingSummaryResponse {
  publicCode: string;
  hotelId: number;
  hotelName: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  totalAmount: number;
}

export interface PagedData<T> {
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  content: T[];
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private readonly API_URL = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Bước 1: Tạo Hold (giữ phòng nguyên tử 10 phút)
   * POST /api/v1/holds
   */
  createHold(payload: HoldCreateRequest): Observable<ApiResponse<HoldResponse>> {
    return this.http
      .post<ApiResponse<HoldResponse>>(`${this.API_URL}/holds`, payload)
      .pipe(catchError(this.handleError));
  }

  /**
   * Bước 2: Chuyển đổi Hold thành Booking chính thức
   * POST /api/v1/holds/convert
   * Header: X-Hold-Token
   */
  convertHold(accessToken: string, payload: HoldConversionRequest): Observable<ApiResponse<BookingDetailResponse>> {
    const headers = new HttpHeaders().set('X-Hold-Token', accessToken);
    return this.http
      .post<ApiResponse<BookingDetailResponse>>(`${this.API_URL}/holds/convert`, payload, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Lấy chi tiết Booking theo publicCode
   */
  getBookingByCode(publicCode: string, bookingToken?: string): Observable<ApiResponse<BookingDetailResponse>> {
    const token = localStorage.getItem('access_token');
    if (token) {
      return this.http
        .get<ApiResponse<BookingDetailResponse>>(`${this.API_URL}/bookings/me/${publicCode}`)
        .pipe(catchError(this.handleError));
    }

    let headers = new HttpHeaders();
    if (bookingToken) {
      headers = headers.set('X-Booking-Token', bookingToken);
    }
    return this.http
      .get<ApiResponse<BookingDetailResponse>>(`${this.API_URL}/bookings/lookup/${publicCode}`, { headers })
      .pipe(catchError(this.handleError));
  }

  getBookingById(bookingId: string): Observable<ApiResponse<BookingDetailResponse>> {
    return this.getBookingByCode(bookingId);
  }

  /**
   * Lấy danh sách booking của khách hàng đăng nhập
   * GET /api/v1/bookings/me
   */
  getMyBookings(page = 0, size = 10): Observable<ApiResponse<PagedData<BookingSummaryResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<ApiResponse<PagedData<BookingSummaryResponse>>>(`${this.API_URL}/bookings/me`, { params })
      .pipe(catchError(this.handleError));
  }

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
        errorMessage = error.error?.message || 'Phòng đã hết hoặc đã có người đặt.';
      } else {
        errorMessage = error.error?.message || `Mã lỗi: ${error.status}`;
      }
    }
    console.error('CheckoutService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
