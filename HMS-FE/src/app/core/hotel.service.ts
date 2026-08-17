import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { ApiResponse } from './models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class HotelService {
  private readonly apiUrl = `${environment.apiUrl}/hotels`;
  private activeHotelIdSubject = new BehaviorSubject<number | null>(null);
  activeHotelId$ = this.activeHotelIdSubject.asObservable();

  constructor(private http: HttpClient) {}

  getHotels(page = 0, size = 50): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  resolveActiveHotelId(): Observable<number> {
    if (this.activeHotelIdSubject.value !== null) {
      return of(this.activeHotelIdSubject.value);
    }
    return this.getHotels().pipe(
      map(res => {
        const content = res.data?.content || [];
        if (content.length > 0) {
          const firstId = content[0].id;
          this.activeHotelIdSubject.next(firstId);
          return firstId;
        }
        this.activeHotelIdSubject.next(1);
        return 1;
      }),
      catchError(() => {
        this.activeHotelIdSubject.next(1);
        return of(1);
      })
    );
  }

  setActiveHotelId(id: number): void {
    this.activeHotelIdSubject.next(id);
  }

  getActiveHotelId(): number {
    return this.activeHotelIdSubject.value ?? 1;
  }
}
