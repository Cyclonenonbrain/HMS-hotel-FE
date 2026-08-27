import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse, PagedData } from '../core/models/api-response.model';

export interface MyBookingItem {
  bookingId: string;
  publicCode: string;
  hotelName?: string;
  roomTypeName?: string;
  thumbnailUrl: string | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
}

export interface BookingCheckInAssignmentRequest {
  booking_item_id?: string | number;
  bookingItemId?: string | number;
  room_id?: string | number;
  roomId?: string | number;
  room_number?: string;
  roomNumber?: string;
  notes?: string;
}

export interface BookingCheckInRequest {
  room_assignments?: BookingCheckInAssignmentRequest[];
  roomAssignments?: BookingCheckInAssignmentRequest[];
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly API_URL = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Lấy danh sách booking của customer hiện tại
   * GET /api/v1/bookings/me
   */
  getMyBookings(page = 0, size = 20): Observable<ApiResponse<MyBookingItem[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PagedData<any>>>(`${this.API_URL}/bookings/me`, { params }).pipe(
      map(res => {
        const rawContent = Array.isArray(res.data) ? res.data : (res.data?.content || []);
        const mappedItems: MyBookingItem[] = rawContent.map((item: any) => {
          const checkIn = item.checkInDate || item.check_in || item.checkIn || '';
          const checkOut = item.checkOutDate || item.check_out || item.checkOut || '';
          const nights = this.calculateNights(checkIn, checkOut);
          const publicCode = item.publicCode || item.public_code || item.id || '';

          return {
            bookingId: publicCode,
            publicCode: publicCode,
            hotelName: item.hotelName || item.hotel_name || '',
            roomTypeName: item.roomTypeName || item.room_type_name || 'Phòng nghỉ',
            thumbnailUrl: item.thumbnailUrl || null,
            checkIn: checkIn,
            checkOut: checkOut,
            nights: nights,
            totalAmount: Number(item.totalAmount ?? item.total_amount ?? 0),
            status: String(item.status || 'PENDING'),
            paymentStatus: String(item.status || 'PENDING')
          };
        });

        return {
          ...res,
          data: mappedItems
        };
      })
    );
  }

  /**
   * Lấy danh sách booking cho Staff
   * GET /api/v1/staff/bookings
   */
  getStaffBookings(query?: any): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (query) {
      Object.keys(query).forEach(key => {
        if (query[key] !== undefined && query[key] !== null && query[key] !== '') {
          params = params.set(key, query[key].toString());
        }
      });
    }
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/staff/bookings`, { params });
  }

  /**
   * Alias cho getStaffBookings
   */
  getBookings(query?: any): Observable<ApiResponse<any>> {
    return this.getStaffBookings(query);
  }

  /**
   * Lấy chi tiết booking
   */
  getBookingById(id: string): Observable<ApiResponse<any>> {
    return this.getBookingByCode(id);
  }

  getBookingByCode(publicCode: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/staff/bookings/${publicCode}`);
  }

  /**
   * Tạo booking walk-in cho Staff
   * POST /api/v1/staff/bookings/walk-ins
   */
  createBooking(bookingRequest: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/staff/bookings/walk-ins`, bookingRequest);
  }

  /**
   * Cập nhật trạng thái booking
   */
  updateBookingStatus(id: string, statusRequest: { status: string }): Observable<ApiResponse<any>> {
    const status = (statusRequest.status || '').toUpperCase();
    if (status === 'CHECKED_IN') {
      return this.checkInBooking(id);
    }
    if (status === 'COMPLETED' || status === 'CHECKED_OUT') {
      return this.checkOutBooking(id);
    }
    return of({ code: '2001', success: true, message: 'Status updated', data: { id, status } });
  }

  /**
   * Check-in booking (Staff)
   * POST /api/v1/staff/bookings/{publicCode}/check-in
   */
  checkInBooking(publicCode: string, payload?: BookingCheckInRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/staff/bookings/${publicCode}/check-in`, payload || {});
  }

  /**
   * Check-out booking (Staff)
   * POST /api/v1/staff/bookings/{publicCode}/check-out
   */
  checkOutBooking(publicCode: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/staff/bookings/${publicCode}/check-out`, {});
  }

  private calculateNights(checkIn: string, checkOut: string): number {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}
