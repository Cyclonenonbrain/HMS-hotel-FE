import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { ApiResponse } from './models/api-response.model';
import { AmenityCreateRequest, AmenityResponse } from './models/amenity.model';

@Injectable({ providedIn: 'root' })
export class AmenityService {
  private readonly apiUrl = `${environment.apiUrl}/admin/amenities`;

  constructor(private http: HttpClient) {}

  getAmenities(): Observable<ApiResponse<AmenityResponse[]>> {
    return this.http.get<ApiResponse<AmenityResponse[]>>(this.apiUrl);
  }

  createAmenity(request: AmenityCreateRequest): Observable<ApiResponse<AmenityResponse>> {
    return this.http.post<ApiResponse<AmenityResponse>>(this.apiUrl, request);
  }

  updateAmenity(id: string, request: AmenityCreateRequest): Observable<ApiResponse<AmenityResponse>> {
    return this.http.put<ApiResponse<AmenityResponse>>(`${this.apiUrl}/${id}`, request);
  }

  deleteAmenity(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
