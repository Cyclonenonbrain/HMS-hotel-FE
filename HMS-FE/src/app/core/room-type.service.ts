import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from './models/api-response.model';
import { RoomTypeResponse, RoomTypeCreateRequest } from './models/room-type.model';

@Injectable({
  providedIn: 'root'
})
export class RoomTypeService {
  private apiUrl = `${environment.apiUrl}/room-types`;

  constructor(private http: HttpClient) {}

  getRoomTypes(): Observable<ApiResponse<RoomTypeResponse[]>> {
    return this.http.get<ApiResponse<RoomTypeResponse[]>>(this.apiUrl);
  }

  getRoomTypeById(id: string): Observable<ApiResponse<RoomTypeResponse>> {
    return this.http.get<ApiResponse<RoomTypeResponse>>(`${this.apiUrl}/${id}`);
  }

  createRoomType(request: RoomTypeCreateRequest): Observable<ApiResponse<RoomTypeResponse>> {
    return this.http.post<ApiResponse<RoomTypeResponse>>(this.apiUrl, request);
  }

  updateRoomType(id: string, request: RoomTypeCreateRequest): Observable<ApiResponse<RoomTypeResponse>> {
    return this.http.put<ApiResponse<RoomTypeResponse>>(`${this.apiUrl}/${id}`, request);
  }

  deleteRoomType(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
