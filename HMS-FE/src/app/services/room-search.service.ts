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
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class RoomSearchService {
  private readonly apiUrl = environment.apiUrl || 'http://localhost:8081/api/v1';

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

    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/availability/search`, { params: httpParams })
      .pipe(
        map(response => {
          const list = response.data || [];
          return list.map(item => {
            const rt = item.roomType;
            return {
              roomTypeId: String(rt.id),
              name: rt.name,
              description: rt.description || '',
              pricePerNight: parseFloat(rt.basePrice || 0),
              rating: 4.9,
              amenities: (rt.amenities || []).map((a: any) => String(a.name || '').toLowerCase().replace(/\s+/g, '_')),
              thumbnailUrl: this.getImageByRoomName(rt.name),
              capacity: rt.maxOccupancy || rt.baseOccupancy || 2,
              availableRooms: item.availableRooms ?? 0,
              bedConfig: rt.bedConfig || null
            };
          });
        }),
        catchError(error => {
          console.warn('Real availability search failed, falling back to mock search:', error);
          return this.fallbackSearch(params);
        })
      );
  }

  /**
   * Fallback: Use existing room-types API and mock availableRooms
   */
  private fallbackSearch(params: RoomSearchParams): Observable<RoomSearchResult[]> {
    const hotelId = this.hotelService.getActiveHotelId();
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/hotels/${hotelId}/room-types`)
      .pipe(
        map(response => {
          const rooms = response.data || [];
          return rooms.map(room => this.transformToSearchResult(room, params));
        }),
        catchError(error => {
          console.error('Fallback search also failed:', error);
          return of([]);
        })
      );
  }

  /**
   * Transform room-type data to RoomSearchResult format
   * Mocks availableRooms based on room data
   */
  private transformToSearchResult(room: any, params: RoomSearchParams): RoomSearchResult {
    // Mock availableRooms: random 0-10, weighted towards having rooms available
    const mockAvailable = this.generateMockAvailability(room.id);
    
    return {
      roomTypeId: room.id,
      name: room.name,
      description: room.description || '',
      pricePerNight: parseFloat(room.basePrice || room.base_price || 0),
      rating: 4.9, // Default rating
      amenities: this.extractAmenities(room),
      thumbnailUrl: this.getImageByRoomName(room.name),
      capacity: room.capacity || 2,
      availableRooms: mockAvailable,
      bedConfig: room.bedConfig || room.bed_config || null
    };
  }

  /**
   * Generate mock availability (will be replaced by real API)
   * Uses room ID hash for consistent results per room
   */
  private generateMockAvailability(roomId: string): number {
    // Create a simple hash from roomId for consistent mock data
    let hash = 0;
    for (let i = 0; i < roomId.length; i++) {
      hash = ((hash << 5) - hash) + roomId.charCodeAt(i);
      hash |= 0;
    }
    // Return 0-10, with 80% chance of having rooms (1-10)
    const rand = Math.abs(hash % 100);
    if (rand < 20) return 0; // 20% chance sold out
    if (rand < 40) return Math.abs(hash % 3) + 1; // 20% chance 1-3 rooms
    if (rand < 70) return Math.abs(hash % 5) + 3; // 30% chance 3-7 rooms
    return Math.abs(hash % 5) + 6; // 30% chance 6-10 rooms
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

  /**
   * Helper: Get today's date in YYYY-MM-DD format
   */
  static getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Helper: Get tomorrow's date in YYYY-MM-DD format
   */
  static getTomorrow(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  /**
   * Helper: Calculate number of nights between two dates
   */
  static calculateNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
