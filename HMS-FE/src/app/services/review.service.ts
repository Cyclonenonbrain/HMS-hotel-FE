import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ReviewResponse {
  id: string;
  bookingId: string;
  roomId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly API_URL = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  getReviewByBooking(bookingId: string): Observable<ApiResponse<ReviewResponse>> {
    return this.http.get<ApiResponse<ReviewResponse>>(`${this.API_URL}/booking/${bookingId}`);
  }

  createReview(payload: { bookingId: string; rating: number; comment: string }): Observable<ApiResponse<ReviewResponse>> {
    return this.http.post<ApiResponse<ReviewResponse>>(this.API_URL, payload);
  }

  updateReview(reviewId: string, payload: { rating: number; comment: string }): Observable<ApiResponse<ReviewResponse>> {
    return this.http.put<ApiResponse<ReviewResponse>>(`${this.API_URL}/${reviewId}`, payload);
  }
}
