import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { ApiResponse } from './models/api-response.model';
import { AmenityCreateRequest, AmenityResponse } from './models/amenity.model';

@Injectable({ providedIn: 'root' })
export class AmenityService {
  private readonly apiUrl = `${environment.apiUrl}/amenities`;

  constructor(private http: HttpClient) {}

  getAmenities(): Observable<ApiResponse<AmenityResponse[]>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}?page=0&size=1000`).pipe(
      map(res => {
        const content = res.data?.content || [];
        return {
          ...res,
          data: content.map((item: any) => ({
            id: String(item.id),
            code: item.name.toUpperCase().replace(/\s+/g, '_'),
            name: item.name,
            iconUrl: item.iconUrl
          }))
        };
      })
    );
  }

  createAmenity(request: AmenityCreateRequest): Observable<ApiResponse<AmenityResponse>> {
    const payload = {
      name: request.name,
      iconUrl: `/icons/${request.code.toLowerCase()}.svg`
    };
    return this.http.post<ApiResponse<any>>(this.apiUrl, payload).pipe(
      map(res => ({
        ...res,
        data: {
          id: String(res.data?.id),
          code: (res.data?.name || '').toUpperCase().replace(/\s+/g, '_'),
          name: res.data?.name || '',
          iconUrl: res.data?.iconUrl
        }
      }))
    );
  }

  updateAmenity(id: string, request: AmenityCreateRequest): Observable<ApiResponse<AmenityResponse>> {
    const payload = {
      name: request.name,
      iconUrl: `/icons/${request.code.toLowerCase()}.svg`
    };
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, payload).pipe(
      map(res => ({
        ...res,
        data: {
          id: String(res.data?.id),
          code: (res.data?.name || '').toUpperCase().replace(/\s+/g, '_'),
          name: res.data?.name || '',
          iconUrl: res.data?.iconUrl
        }
      }))
    );
  }

  deleteAmenity(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
