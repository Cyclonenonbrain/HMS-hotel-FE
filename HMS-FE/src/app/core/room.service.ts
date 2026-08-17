import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { ApiResponse } from './models/api-response.model';
import { PageResponse, RoomCreateRequest, RoomResponse, RoomStatus } from './models/room.model';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  constructor(private http: HttpClient) {}

  private getApiUrl(roomTypeId: string | number): string {
    return `${environment.apiUrl}/room-types/${roomTypeId}/rooms`;
  }

  getRoomsByRoomType(roomTypeId: string | number, page = 0, size = 10): Observable<ApiResponse<PageResponse<RoomResponse>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<any>>(this.getApiUrl(roomTypeId), { params }).pipe(
      map((res) => ({
        ...res,
        data: this.mapRoomPageResponse(res.data)
      }))
    );
  }

  createRoom(roomTypeId: string | number, request: RoomCreateRequest): Observable<ApiResponse<RoomResponse>> {
    return this.http.post<ApiResponse<any>>(this.getApiUrl(roomTypeId), this.toApiRequest(request)).pipe(
      map((res) => ({
        ...res,
        data: this.mapRoomResponse(res.data)
      }))
    );
  }

  updateRoom(roomTypeId: string | number, id: string | number, request: RoomCreateRequest): Observable<ApiResponse<RoomResponse>> {
    return this.http.put<ApiResponse<any>>(`${this.getApiUrl(roomTypeId)}/${id}`, this.toApiRequest(request)).pipe(
      map((res) => ({
        ...res,
        data: this.mapRoomResponse(res.data)
      }))
    );
  }

  updateRoomStatus(roomTypeId: string | number, id: string | number, status: RoomStatus): Observable<ApiResponse<RoomResponse>> {
    return this.http.put<ApiResponse<any>>(`${this.getApiUrl(roomTypeId)}/${id}`, { status }).pipe(
      map((res) => ({
        ...res,
        data: this.mapRoomResponse(res.data)
      }))
    );
  }

  deleteRoom(roomTypeId: string | number, id: string | number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.getApiUrl(roomTypeId)}/${id}`);
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

  private mapRoomPageResponse(page: any): PageResponse<RoomResponse> {
    return {
      content: (page?.content || []).map((item: any) => this.mapRoomResponse(item)),
      totalElements: Number(page?.totalElements ?? 0),
      totalPages: Number(page?.totalPages ?? 0),
      size: Number(page?.size ?? 0),
      number: Number(page?.number ?? 0),
      first: !!page?.first,
      last: !!page?.last
    };
  }

  private toApiRequest(request: RoomCreateRequest): any {
    return {
      room_number: request.roomNumber,
      status: request.status,
      floor: request.floor
    };
  }
}
