import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { ApiResponse } from './models/api-response.model';
import { RoomCreateRequest, RoomQuery, RoomResponse, RoomStatus } from './models/room.model';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private readonly apiUrl = `${environment.apiUrl}/rooms`;

  constructor(private http: HttpClient) {}

  getRooms(query?: RoomQuery): Observable<ApiResponse<RoomResponse[]>> {
    let params = new HttpParams();
    if (query?.roomTypeId) params = params.set('room_type_id', query.roomTypeId);
    if (query?.status) params = params.set('status', query.status);
    if (query?.floor !== undefined && query.floor !== null) params = params.set('floor', query.floor);

    return this.http.get<ApiResponse<any[]>>(this.apiUrl, { params }).pipe(
      map((res) => ({
        ...res,
        data: (res.data || []).map((item: any) => this.mapRoomResponse(item))
      }))
    );
  }

  createRoom(request: RoomCreateRequest): Observable<ApiResponse<RoomResponse>> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, this.toApiRequest(request)).pipe(
      map((res) => ({
        ...res,
        data: this.mapRoomResponse(res.data)
      }))
    );
  }

  updateRoom(id: string, request: RoomCreateRequest): Observable<ApiResponse<RoomResponse>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, this.toApiRequest(request)).pipe(
      map((res) => ({
        ...res,
        data: this.mapRoomResponse(res.data)
      }))
    );
  }

  updateRoomStatus(id: string, status: RoomStatus): Observable<ApiResponse<RoomResponse>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/${id}/status`, { status }).pipe(
      map((res) => ({
        ...res,
        data: this.mapRoomResponse(res.data)
      }))
    );
  }

  deleteRoom(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  private mapRoomResponse(item: any): RoomResponse {
    return {
      id: item?.id,
      roomNumber: item?.roomNumber ?? item?.room_number ?? '',
      roomTypeId: item?.roomTypeId ?? item?.room_type_id ?? '',
      roomTypeName: item?.roomTypeName ?? item?.room_type_name ?? '',
      roomTypeCapacity: Number(item?.roomTypeCapacity ?? item?.room_type_capacity ?? 0),
      roomTypeBasePrice: Number(item?.roomTypeBasePrice ?? item?.room_type_base_price ?? 0),
      status: item?.status ?? 'AVAILABLE',
      floor: Number(item?.floor ?? 0),
      createdAt: item?.createdAt ?? item?.created_at,
      updatedAt: item?.updatedAt ?? item?.updated_at
    };
  }

  private toApiRequest(request: RoomCreateRequest): any {
    return {
      room_number: request.roomNumber,
      room_type_id: request.roomTypeId,
      status: request.status,
      floor: request.floor
    };
  }
}
