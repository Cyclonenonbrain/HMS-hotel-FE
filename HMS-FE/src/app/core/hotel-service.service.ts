import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { ApiResponse } from './models/api-response.model';
import { HotelServiceCreateRequest, HotelServiceQuery, HotelServiceResponse, PageResponse } from './models/hotel-service.model';
import { HotelService } from './hotel.service';

@Injectable({
  providedIn: 'root'
})
export class HotelServiceService {
  private readonly apiUrl = `${environment.apiUrl}/admin/services`;

  constructor(
    private http: HttpClient,
    private hotelService: HotelService
  ) {}

  getServices(query?: HotelServiceQuery): Observable<ApiResponse<PageResponse<HotelServiceResponse>>> {
    const hotelId = this.hotelService.getActiveHotelId();
    let params = new HttpParams().set('hotelId', hotelId.toString());
    if (query?.page !== undefined) params = params.set('page', query.page);
    if (query?.size !== undefined) params = params.set('size', query.size);

    return this.http.get<ApiResponse<any>>(this.apiUrl, { params }).pipe(
      map((res) => ({
        ...res,
        data: this.mapPageResponse(res.data)
      }))
    );
  }

  createService(request: HotelServiceCreateRequest): Observable<ApiResponse<HotelServiceResponse>> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, this.toApiRequest(request)).pipe(
      map((res) => ({
        ...res,
        data: this.mapServiceResponse(res.data)
      }))
    );
  }

  updateService(id: string, request: HotelServiceCreateRequest): Observable<ApiResponse<HotelServiceResponse>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, this.toApiRequest(request)).pipe(
      map((res) => ({
        ...res,
        data: this.mapServiceResponse(res.data)
      }))
    );
  }

  deleteService(id: string): Observable<ApiResponse<void>> {
    const hotelId = this.hotelService.getActiveHotelId();
    const params = new HttpParams().set('hotelId', hotelId.toString());
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`, { params });
  }

  private mapPageResponse(page: any): PageResponse<HotelServiceResponse> {
    const content = page?.content || (Array.isArray(page) ? page : []);
    return {
      content: content.map((item: any) => this.mapServiceResponse(item)),
      totalElements: Number(page?.totalElements ?? content.length),
      totalPages: Number(page?.totalPages ?? 1),
      size: Number(page?.size ?? content.length),
      number: Number(page?.number ?? page?.page ?? 0),
      first: !!page?.first,
      last: !!page?.last
    };
  }

  private mapServiceResponse(item: any): HotelServiceResponse {
    return {
      id: String(item?.id ?? ''),
      name: item?.name ?? '',
      price: Number(item?.unitPrice ?? item?.unit_price ?? item?.price ?? 0),
      isActive: item?.isRetired !== undefined ? !item.isRetired : (item?.isActive ?? item?.is_active ?? true),
      createdAt: item?.createdAt ?? item?.created_at,
      updatedAt: item?.updatedAt ?? item?.updated_at
    };
  }

  private toApiRequest(request: HotelServiceCreateRequest): any {
    const hotelId = this.hotelService.getActiveHotelId();
    return {
      hotelId: hotelId,
      name: request.name,
      description: (request as any).description || 'Hotel service',
      unitPrice: request.price
    };
  }
}
