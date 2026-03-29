import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private apiUrl = 'http://localhost:8081/api/v1/room-types';

  constructor(private http: HttpClient) {}

  // Hàm helper để lấy Header có chứa Token
  private getAuthHeaders(): HttpHeaders {
    const userData = localStorage.getItem('currentUser');
    const token = userData ? JSON.parse(userData).accessToken : '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Lấy toàn bộ danh sách phòng
  getAllRooms(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Lấy chi tiết một phòng theo ID (Mới thêm)
  getRoomById(id: string): Observable<any> {
    // Thông thường API sẽ có dạng: .../api/v1/room-types/{id}
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<any>(url, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Chuyển đổi giá hiển thị hợp lý dựa trên loại phòng (VND)
  getDisplayPrice(roomTypeName: string, basePrice: number): number {
    const name = roomTypeName?.toLowerCase() || '';

    // Mapping giá dựa trên tiêu chuẩn khách sạn hạng sang Việt Nam
    if (name.includes('suite') && name.includes('presidential') || name.includes('royal')) {
      return 150000000; // 150M VND cho Presidential Suite
    } else if (name.includes('suite') && (name.includes('specialty') || name.includes('signature'))) {
      return 35000000; // 35M VND cho Specialty Suite
    } else if (name.includes('suite')) {
      return 12000000; // 12M VND cho Junior/Family Suite
    } else if (name.includes('executive') || name.includes('premier') || name.includes('grand')) {
      return 7000000; // 7M VND cho Executive/Premier
    } else if (name.includes('deluxe') || name.includes('superior')) {
      return 4500000; // 4.5M VND cho Deluxe
    } else if (name.includes('family')) {
      return 10000000; // 10M VND cho Family
    } else if (name.includes('standard')) {
      return 3500000; // 3.5M VND cho Standard
    } else if (name.includes('single')) {
      return 3000000; // 3M VND cho Single
    } else {
      // Fallback dựa trên base_price nếu có
      if (basePrice > 1000000) return 12000000; // Suite range
      if (basePrice > 500000) return 4500000; // Deluxe range
      return 3500000; // Standard range
    }
  }

  // Format giá VND với dấu chấm
  formatPriceVND(price: number): string {
    return price.toLocaleString('vi-VN') + ' ₫';
  }
}