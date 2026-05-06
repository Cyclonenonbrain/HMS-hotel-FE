import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { ApiResponse } from './models/api-response.model';
import { CouponCreateRequest, CouponQuery, CouponResponse, PageResponse } from './models/coupon.model';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private readonly apiUrl = `${environment.apiUrl}/admin/coupons`;

  constructor(private http: HttpClient) {}

  getCoupons(query?: CouponQuery): Observable<ApiResponse<PageResponse<CouponResponse>>> {
    let params = new HttpParams();
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

  createCoupon(request: CouponCreateRequest): Observable<ApiResponse<CouponResponse>> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, this.toApiRequest(request)).pipe(
      map((res) => ({
        ...res,
        data: this.mapCouponResponse(res.data)
      }))
    );
  }

  updateCoupon(id: string, request: CouponCreateRequest): Observable<ApiResponse<CouponResponse>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, this.toApiRequest(request)).pipe(
      map((res) => ({
        ...res,
        data: this.mapCouponResponse(res.data)
      }))
    );
  }

  deleteCoupon(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  private mapPageResponse(page: any): PageResponse<CouponResponse> {
    return {
      content: (page?.content || []).map((item: any) => this.mapCouponResponse(item)),
      totalElements: Number(page?.totalElements ?? 0),
      totalPages: Number(page?.totalPages ?? 0),
      size: Number(page?.size ?? 0),
      number: Number(page?.number ?? 0),
      first: !!page?.first,
      last: !!page?.last
    };
  }

  private mapCouponResponse(item: any): CouponResponse {
    return {
      id: item?.id,
      code: item?.code ?? '',
      discountType: item?.discountType ?? item?.discount_type ?? 'PERCENT',
      value: Number(item?.value ?? 0),
      maxUsage: item?.maxUsage ?? item?.max_usage ?? null,
      usedCount: Number(item?.usedCount ?? item?.used_count ?? 0),
      expiresAt: item?.expiresAt ?? item?.expires_at ?? null,
      isActive: Boolean(item?.isActive ?? item?.is_active ?? false),
      isExpired: Boolean(item?.isExpired ?? item?.is_expired ?? false),
      isUsageLimitReached: Boolean(item?.isUsageLimitReached ?? item?.is_usage_limit_reached ?? false),
      createdAt: item?.createdAt ?? item?.created_at
    };
  }

  private toApiRequest(request: CouponCreateRequest): any {
    return {
      code: request.code,
      discountType: request.discountType,
      value: request.value,
      maxUsage: request.maxUsage,
      expiresAt: request.expiresAt,
      isActive: request.isActive
    };
  }
}
