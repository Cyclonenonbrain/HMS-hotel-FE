import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { HotelService } from '../core/hotel.service';

@Injectable({ providedIn: 'root' })
export class RoomService {
  constructor(
    private http: HttpClient,
    private hotelService: HotelService
  ) {}

  private getApiUrl(): string {
    const hotelId = this.hotelService.getActiveHotelId();
    return `${environment.apiUrl}/hotels/${hotelId}/room-types`;
  }

  getAllRooms(): Observable<any> {
    return this.http.get<any>(this.getApiUrl());
  }

  getRoomById(id: string): Observable<any> {
    return this.http.get<any>(`${this.getApiUrl()}/${id}`);
  }
}
