import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  getRoomTypes(hotelId?: number, page = 0, size = 50): Observable<ApiResponse<RoomTypeResponse[]>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<ApiResponse<any>>(this.getApiUrl(hotelId), { params }).pipe(
      map((res) => {
        const rawList = Array.isArray(res.data) ? res.data : (res.data?.content || []);
        return {
          ...res,
          data: rawList.map((item: any) => this.mapRoomTypeResponse(item))
        };
      })
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
    const rawAmenities = item?.amenities || [];
    const mappedAmenities = rawAmenities.map((a: any) => {
      if (typeof a === 'string') {
        return { code: a.toUpperCase().replace(/\s+/g, '_'), name: a };
      }
      const name = a?.name || a?.code || '';
      return {
        id: a?.id,
        code: a?.code || name.toUpperCase().replace(/\s+/g, '_'),
        name: name,
        iconUrl: a?.iconUrl
      };
    });

    return {
      id: String(item?.id ?? ''),
      name: item?.name ?? '',
      description: item?.description ?? '',
      basePrice: Number(item?.basePrice ?? item?.base_price ?? 0),
      capacity: Number(item?.maxOccupancy ?? item?.baseOccupancy ?? item?.capacity ?? 2),
      bedConfig: item?.bedConfig ?? item?.bed_config ?? null,
      amenities: mappedAmenities,
      createdAt: item?.createdAt ?? item?.created_at,
      updatedAt: item?.updatedAt ?? item?.updated_at
    };
  }

  private toApiRequest(request: RoomTypeCreateRequest): any {
    const capacity = Number(request.capacity || 2);
    return {
      name: request.name,
      description: request.description,
      basePrice: request.basePrice,
      baseOccupancy: Math.max(1, Math.min(2, capacity)),
      maxOccupancy: Math.max(1, capacity),
      amenityIds: request.amenityIds || []
    };
  }
}
