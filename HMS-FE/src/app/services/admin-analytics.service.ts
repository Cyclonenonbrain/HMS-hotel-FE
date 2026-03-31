import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export interface DashboardMetrics {
  fromDate: string;
  toDate: string;
  totalRevenue: number | string;
  occupancyRate: number | string;
  averageDailyRate: number | string;
  revenuPerAvailableRoom: number | string;
  activeBookings: number;
  totalRooms: number;
  outstandingBalance: number | string;
  lastUpdated: string;
}

export interface RevenueBreakdown {
  date: string;
  dailyRevenue: number | string;
  cumulativeRevenue: number | string;
  bookingCount: number;
  roomNights: number;
  averageRate: number | string;
}

export interface OccupancySnapshot {
  roomTypeId: string;
  roomTypeName: string;
  totalRooms: number;
  occupiedRooms: number;
  occupancyPercent: number | string;
  averageDailyRate: number | string;
  revenueLoss: number | string;
}

@Injectable({ providedIn: 'root' })
export class AdminAnalyticsService {
  private readonly API_URL = `${environment.apiUrl}/admin/stats`;

  constructor(private http: HttpClient) {}

  getDashboard(days = 30): Observable<ApiResponse<DashboardMetrics>> {
    const params = new HttpParams().set('days', String(days));
    return this.http.get<ApiResponse<DashboardMetrics>>(`${this.API_URL}/dashboard`, { params });
  }

  getRevenue(granulation: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'MONTHLY'): Observable<ApiResponse<RevenueBreakdown[]>> {
    const params = new HttpParams().set('granulation', granulation);
    return this.http.get<ApiResponse<RevenueBreakdown[]>>(`${this.API_URL}/revenue`, { params });
  }

  getRoomOccupancy(): Observable<ApiResponse<OccupancySnapshot[]>> {
    return this.http.get<ApiResponse<OccupancySnapshot[]>>(`${this.API_URL}/room`);
  }
}
