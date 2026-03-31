import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environment/environment';

/**
 * Response interface for Featured Room Types API
 * All fields in snake_case as per backend convention
 */
export interface FeaturedRoomType {
  room_type_id: string;
  name: string;
  thumbnail_url: string | null;
  price_per_night: number;
  rating: number;
  amenities: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class FeaturedRoomService {
  private readonly apiUrl = environment.apiUrl || 'http://localhost:8081/api/v1';

  constructor(private http: HttpClient) {}

  /**
   * Get top 6 featured room types sorted by rating DESC
   * Endpoint: GET /api/v1/room-types/featured
   */
  getFeaturedRoomTypes(): Observable<FeaturedRoomType[]> {
    return this.http.get<ApiResponse<FeaturedRoomType[]>>(`${this.apiUrl}/room-types/featured`)
      .pipe(
        map(response => response.data || []),
        catchError(() => {
          return of([]);
        })
      );
  }
}
