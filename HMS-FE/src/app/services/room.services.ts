import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private apiUrl = 'http://localhost:8081/api/v1/room-types';

  constructor(private http: HttpClient) {}

  getAllRooms(): Observable<any[]> {
    const userData = localStorage.getItem('currentUser');
    const token = userData ? JSON.parse(userData).accessToken : '';

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}` // Gửi Token để Spring Security cho phép qua
    });

    return this.http.get<any[]>(this.apiUrl, { headers });
  }
}