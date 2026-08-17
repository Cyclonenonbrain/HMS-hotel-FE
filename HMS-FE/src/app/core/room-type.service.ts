import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { ApiResponse } from './models/api-response.model';
import { RoomTypeResponse, RoomTypeCreateRequest } from './models/room-type.model';
import { HotelService } from './hotel.service';

@Injectable({
  providedIn: 'root'
})
export class RoomTypeService {
  constructor(
    private http: HttpClient,
    private hotelService: HotelService
  ) {}

  private getApiUrl(hotelId?: number): string {
    const activeHotelId = hotelId ?? this.hotelService.getActiveHotelId();
    return `${environment.apiUrl}/hotels/${activeHotelId}/room-types`;
  }

  getRoomTypes(hotelId?: number): Observable<ApiResponse<RoomTypeResponse[]>> {
    return this.http.get<ApiResponse<any[]>>(this.getApiUrl(hotelId)).pipe(
      map((res) => ({
        ...res,
        data: (res.data || []).map((item: any) => this.mapRoomTypeResponse(item))
      }))
    );
  }

  getRoomTypeById(id: string, hotelId?: number): Observable<ApiResponse<RoomTypeResponse>> {
    return this.http.get<ApiResponse<any>>(`${this.getApiUrl(hotelId)}/${id}`).pipe(
      map((res) => ({
        ...res,
        data: this.mapRoomTypeResponse(res.data)
      }))
    );
  }

  createRoomType(request: RoomTypeCreateRequest, hotelId?: number): Observable<ApiResponse<RoomTypeResponse>> {
    const payload = this.toApiRequest(request);
    return this.http.post<ApiResponse<any>>(this.getApiUrl(hotelId), payload).pipe(
      map((res) => ({
        ...res,
        data: this.mapRoomTypeResponse(res.data)
      }))
    );
  }

  updateRoomType(id: string, request: RoomTypeCreateRequest, hotelId?: number): Observable<ApiResponse<RoomTypeResponse>> {
    const payload = this.toApiRequest(request);
    return this.http.put<ApiResponse<any>>(`${this.getApiUrl(hotelId)}/${id}`, payload).pipe(
      map((res) => ({
        ...res,
        data: this.mapRoomTypeResponse(res.data)
      }))
    );
  }

  deleteRoomType(id: string, hotelId?: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.getApiUrl(hotelId)}/${id}`);
  }

  private mapRoomTypeResponse(item: any): RoomTypeResponse {
    return {
      id: item?.id,
      name: item?.name ?? '',
      description: item?.description ?? '',
      basePrice: Number(item?.basePrice ?? item?.base_price ?? 0),
      capacity: Number(item?.capacity ?? 0),
      bedConfig: item?.bedConfig ?? item?.bed_config ?? null,
      amenities: item?.amenities ?? [],
      createdAt: item?.createdAt ?? item?.created_at,
      updatedAt: item?.updatedAt ?? item?.updated_at
    };
  }

  private toApiRequest(request: RoomTypeCreateRequest): any {
    return {
      name: request.name,
      description: request.description,
      base_price: request.basePrice,
      capacity: request.capacity,
      bed_config: request.bedConfig ?? null,
      amenities: request.amenities ?? []
    };
  }
}
