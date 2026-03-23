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
}