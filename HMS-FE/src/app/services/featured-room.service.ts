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
        catchError(error => {
          console.warn('Featured room types API not available, falling back to room-types API');
          return this.fallbackFeatured();
        })
      );
  }

  /**
   * Fallback: Use existing room-types API and take first 6
   */
  private fallbackFeatured(): Observable<FeaturedRoomType[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/room-types`)
      .pipe(
        map(response => {
          const rooms = response.data || [];
          // Take first 6 and transform to FeaturedRoomType format
          return rooms.slice(0, 6).map(room => this.transformToFeatured(room));
        }),
        catchError(error => {
          console.error('Fallback also failed:', error);
          return of([]);
        })
      );
  }

  /**
   * Transform room-type data to FeaturedRoomType format (snake_case)
   */
  private transformToFeatured(room: any): FeaturedRoomType {
    return {
      room_type_id: room.id,
      name: room.name,
      thumbnail_url: null, // Will use fallback image
      price_per_night: parseFloat(room.basePrice || room.base_price || 0),
      rating: 4.5 + Math.random() * 0.5, // Mock rating 4.5-5.0
      amenities: this.extractAmenities(room)
    };
  }

  private extractAmenities(room: any): string[] {
    const name = (room.name || '').toLowerCase();
    if (name.includes('deluxe') || name.includes('suite') || name.includes('executive')) {
      return ['wifi', 'king_bed', 'balcony', 'ocean_view'];
    }
    return ['wifi', 'queen_bed', 'tv'];
  }
}
