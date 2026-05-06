import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { ApiResponse } from './models/api-response.model';
import { AdminReviewQuery, AdminReviewResponse, PageResponse } from './models/admin-review.model';

@Injectable({
  providedIn: 'root'
})
export class AdminReviewService {
  private readonly apiUrl = `${environment.apiUrl}/reviews/admin/reviews`;
  private readonly visibilityApiUrl = `${environment.apiUrl}/reviews/admin/reviews`;

  constructor(private http: HttpClient) {}

  getReviews(query?: AdminReviewQuery): Observable<ApiResponse<PageResponse<AdminReviewResponse>>> {
    let params = new HttpParams();
    if (query?.q) params = params.set('q', query.q);
    if (query?.rating !== undefined) params = params.set('rating', query.rating);
    if (query?.isVisible !== undefined) params = params.set('is_visible', query.isVisible);
    if (query?.page !== undefined) params = params.set('page', query.page);
    if (query?.size !== undefined) params = params.set('size', query.size);
    if (query?.sort) params = params.set('sort', query.sort);

    return this.http.get<ApiResponse<any>>(this.apiUrl, { params }).pipe(
      map((res) => ({
        ...res,
        data: this.mapPageResponse(res.data)
      }))
    );
  }

  toggleVisibility(id: string): Observable<ApiResponse<AdminReviewResponse>> {
    return this.http.patch<ApiResponse<any>>(`${this.visibilityApiUrl}/${id}/visibility`, {}).pipe(
      map((res) => ({
        ...res,
        data: this.mapReviewResponse(res.data)
      }))
    );
  }

  deleteReview(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${environment.apiUrl}/reviews/${id}`);
  }

  private mapPageResponse(page: any): PageResponse<AdminReviewResponse> {
    return {
      content: (page?.content || []).map((item: any) => this.mapReviewResponse(item)),
      totalElements: Number(page?.totalElements ?? 0),
      totalPages: Number(page?.totalPages ?? 0),
      size: Number(page?.size ?? 0),
      number: Number(page?.number ?? 0),
      first: !!page?.first,
      last: !!page?.last
    };
  }

  private mapReviewResponse(item: any): AdminReviewResponse {
    return {
      id: item?.id,
      bookingId: item?.bookingId ?? item?.booking_id ?? null,
      roomId: item?.roomId ?? item?.room_id ?? null,
      userId: item?.userId ?? item?.user_id ?? null,
      userName: item?.userName ?? item?.user_name ?? '',
      rating: Number(item?.rating ?? 0),
      comment: item?.comment ?? '',
      isVisible: Boolean(item?.isVisible ?? item?.is_visible ?? false),
      createdAt: item?.createdAt ?? item?.created_at,
      updatedAt: item?.updatedAt ?? item?.updated_at
    };
  }
}
