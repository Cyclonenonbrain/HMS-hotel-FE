import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { ApiResponse } from './models/api-response.model';
import { HotelServiceCreateRequest, HotelServiceQuery, HotelServiceResponse, PageResponse } from './models/hotel-service.model';

@Injectable({
  providedIn: 'root'
})
export class HotelServiceService {
  private readonly apiUrl = `${environment.apiUrl}/admin/services`;

  constructor(private http: HttpClient) {}

  getServices(query?: HotelServiceQuery): Observable<ApiResponse<PageResponse<HotelServiceResponse>>> {
    let params = new HttpParams();
    if (query?.q) params = params.set('q', query.q);
    if (query?.isActive !== undefined) params = params.set('is_active', query.isActive);
    if (query?.page !== undefined) params = params.set('page', query.page);
    if (query?.size !== undefined) params = params.set('size', query.size);
    if (query?.sort) params = params.set('sort', query.sort);

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
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  private mapPageResponse(page: any): PageResponse<HotelServiceResponse> {
    return {
      content: (page?.content || []).map((item: any) => this.mapServiceResponse(item)),
      totalElements: Number(page?.totalElements ?? 0),
      totalPages: Number(page?.totalPages ?? 0),
      size: Number(page?.size ?? 0),
      number: Number(page?.number ?? 0),
      first: !!page?.first,
      last: !!page?.last
    };
  }

  private mapServiceResponse(item: any): HotelServiceResponse {
    return {
      id: item?.id,
      name: item?.name ?? '',
      price: Number(item?.price ?? 0),
      isActive: Boolean(item?.isActive ?? item?.is_active ?? false),
      createdAt: item?.createdAt ?? item?.created_at,
      updatedAt: item?.updatedAt ?? item?.updated_at
    };
  }

  private toApiRequest(request: HotelServiceCreateRequest): any {
    return {
      name: request.name,
      price: request.price,
      is_active: request.isActive
    };
  }
}
