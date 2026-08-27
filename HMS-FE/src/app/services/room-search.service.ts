import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { HotelService } from '../core/hotel.service';

export interface RoomSearchParams {
  checkIn: string;    // ISO date YYYY-MM-DD
  checkOut: string;   // ISO date YYYY-MM-DD
  adults?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  sortBy?: 'price_asc' | 'price_desc';
  page?: number;
  size?: number;
}

export type BedConfig = 'SINGLE_BED' | 'TWIN_BEDS' | 'DOUBLE_BED';

export interface RoomSearchResult {
  roomTypeId: string;
  name: string;
  description: string;
  pricePerNight: number;
  rating: number;
  amenities: string[];
  thumbnailUrl: string;
  capacity: number;
  availableRooms: number;
  bedConfig: BedConfig | null;
}

export interface ApiResponse<T> {
  code?: string;
  success?: boolean;
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class RoomSearchService {
  private readonly apiUrl = environment.apiUrl || 'http://localhost:8080/api/v1';

  constructor(
    private http: HttpClient,
    private hotelService: HotelService
  ) {}

  /**
   * Search rooms with availability based on check-in/check-out dates
   */
  searchRooms(params: RoomSearchParams): Observable<RoomSearchResult[]> {
    const hotelId = this.hotelService.getActiveHotelId();
    let httpParams = new HttpParams()
      .set('checkIn', params.checkIn)
      .set('checkOut', params.checkOut)
      .set('hotelId', hotelId.toString())
      .set('roomsNeeded', '1');

    if (params.adults) {
      httpParams = httpParams.set('guests', params.adults.toString());
    }

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/availability/search`, { params: httpParams })
      .pipe(
        map(response => {
          const raw = response.data;
          const list: any[] = Array.isArray(raw) ? raw : (raw?.content || []);
          return list.map(item => {
            const rt = item.roomType || item;
            const rtAmenities = Array.isArray(rt.amenities)
              ? rt.amenities.map((a: any) => (typeof a === 'string' ? a : a.name || a.code || '').toLowerCase().replace(/\s+/g, '_'))
              : [];

            return {
              roomTypeId: String(rt.id ?? ''),
              name: rt.name || 'Room',
              description: rt.description || '',
              pricePerNight: parseFloat(rt.basePrice || rt.base_price || 0),
              rating: 4.9,
              amenities: rtAmenities.length > 0 ? rtAmenities : this.extractAmenities(rt),
              thumbnailUrl: (rt.images && rt.images.length > 0 && rt.images[0].imageUrl) ? rt.images[0].imageUrl : this.getImageByRoomName(rt.name),
              capacity: rt.maxOccupancy || rt.baseOccupancy || rt.capacity || 2,
              availableRooms: item.availableRooms ?? 1,
              bedConfig: rt.bedConfig || rt.bed_config || null
            };
          });
        }),
        catchError(error => {
          console.warn('Real availability search failed, falling back to catalog search:', error);
          return this.fallbackSearch(params);
        })
      );
  }

  /**
   * Fallback: Use existing room-types API and mock availableRooms
   */
  private fallbackSearch(params: RoomSearchParams): Observable<RoomSearchResult[]> {
    const hotelId = this.hotelService.getActiveHotelId();
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/hotels/${hotelId}/room-types`)
      .pipe(
        map(response => {
          const raw = response.data;
          const rooms: any[] = Array.isArray(raw) ? raw : (raw?.content || []);
          return rooms.map(room => this.transformToSearchResult(room, params));
        }),
        catchError(error => {
          console.error('Fallback search also failed:', error);
          return of([]);
        })
      );
  }

  private transformToSearchResult(room: any, params: RoomSearchParams): RoomSearchResult {
    const rtAmenities = Array.isArray(room.amenities)
      ? room.amenities.map((a: any) => (typeof a === 'string' ? a : a.name || a.code || '').toLowerCase().replace(/\s+/g, '_'))
      : [];

    return {
      roomTypeId: String(room.id ?? ''),
      name: room.name,
      description: room.description || '',
      pricePerNight: parseFloat(room.basePrice || room.base_price || 0),
      rating: 4.9,
      amenities: rtAmenities.length > 0 ? rtAmenities : this.extractAmenities(room),
      thumbnailUrl: (room.images && room.images.length > 0 && room.images[0].imageUrl) ? room.images[0].imageUrl : this.getImageByRoomName(room.name),
      capacity: room.maxOccupancy || room.baseOccupancy || room.capacity || 2,
      availableRooms: this.generateMockAvailability(String(room.id)),
      bedConfig: room.bedConfig || room.bed_config || null
    };
  }

  private generateMockAvailability(roomId: string): number {
    let hash = 0;
    for (let i = 0; i < roomId.length; i++) {
      hash = ((hash << 5) - hash) + roomId.charCodeAt(i);
      hash |= 0;
    }
    const rand = Math.abs(hash % 100);
    if (rand < 10) return 1;
    if (rand < 40) return Math.abs(hash % 3) + 1;
    if (rand < 70) return Math.abs(hash % 5) + 3;
    return Math.abs(hash % 5) + 6;
  }

  private extractAmenities(room: any): string[] {
    const name = (room.name || '').toLowerCase();
    if (name.includes('deluxe') || name.includes('executive')) {
      return ['wifi', 'balcony', 'ocean_view', 'king_bed'];
    }
    return ['wifi', 'queen_bed'];
  }

  private getImageByRoomName(name: string): string {
    const n = (name || '').toLowerCase();
    if (n.includes('deluxe')) return 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000';
    if (n.includes('suite')) return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1000';
    return 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1000';
  }

  static getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  static getTomorrow(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  static calculateNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
