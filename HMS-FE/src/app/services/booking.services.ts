import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Cấu trúc ApiResponse dùng chung của dự án
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface MyBookingItem {
  bookingId: string;
  roomTypeName: string;
  thumbnailUrl: string | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'FAILED' | 'CHECKED_IN' | 'COMPLETED' | 'NO_SHOW';
  paymentStatus: string;
}

export interface BookingCheckInAssignmentRequest {
  booking_item_id: string;
  room_id: string;
  notes?: string;
}

export interface BookingCheckInRequest {
  room_assignments: BookingCheckInAssignmentRequest[];
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly API_URL = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  /**
   * Lấy danh sách đặt phòng (Có hỗ trợ filter/search query)
   * GET /api/v1/bookings
   */
  getBookings(query?: any): Observable<ApiResponse<any[]>> {
    let params = new HttpParams();
    if (query) {
      Object.keys(query).forEach(key => {
        if (query[key]) params = params.append(key, query[key]);
      });
    }
    return this.http.get<ApiResponse<any[]>>(this.API_URL, { params });
  }

  /**
   * Lấy danh sách booking của customer hiện tại
   * GET /api/v1/bookings/my
   */
  getMyBookings(): Observable<ApiResponse<MyBookingItem[]>> {
    return this.http.get<ApiResponse<MyBookingItem[]>>(`${this.API_URL}/my`);
  }

  /**
   * Lấy chi tiết một đơn đặt phòng bằng ID (UUID)
   * GET /api/v1/bookings/{id}
   */
  getBookingById(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/${id}`);
  }

  /**
   * Tạo mới một đơn đặt phòng
   * POST /api/v1/bookings
   */
  createBooking(bookingRequest: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.API_URL, bookingRequest);
  }

  /**
   * Cập nhật trạng thái đặt phòng (Ví dụ: CONFIRMED, CANCELLED)
   * PATCH /api/v1/bookings/{id}/status
   */
  updateBookingStatus(id: string, statusRequest: { status: string }): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.API_URL}/${id}/status`, statusRequest);
  }

  checkInBooking(id: string, payload: BookingCheckInRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/${id}/check-in`, payload);
  }

  checkOutBooking(id: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/${id}/check-out`, {});
  }
}
