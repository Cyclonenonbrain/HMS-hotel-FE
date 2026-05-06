import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * Coupon Validation Response từ Backend
 */
export interface CouponValidationResponse {
  code: string;
  is_valid: boolean;
  reason?: string;                    // Lý do nếu không hợp lệ
  discount_type?: 'PERCENT' | 'AMOUNT' | 'FIXED';
  value?: number;                     // Giá trị coupon (% hoặc số tiền)
  discount_amount?: number;           // Số tiền được giảm
  total_after_discount?: number;      // Tổng sau khi giảm
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private readonly API_URL = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Validate coupon code và tính discount
   * GET /api/v1/customer/coupons/validate?code=XXX&currentTotal=123
   */
  validateCoupon(code: string, currentTotal: number): Observable<ApiResponse<CouponValidationResponse>> {
    const params = new HttpParams()
      .set('code', code)
      .set('currentTotal', currentTotal.toString());

    return this.http
      .get<ApiResponse<any>>(
        `${this.API_URL}/customer/coupons/validate`,
        { params }
      )
      .pipe(
        map((response) => ({
          ...response,
          data: this.normalizeValidationResponse(response?.data)
        })),
        catchError(this.handleError)
      );
  }

  private normalizeValidationResponse(raw: any): CouponValidationResponse {
    const discountTypeRaw = raw?.discount_type ?? raw?.discountType;
    const normalizedDiscountType =
      discountTypeRaw === 'FIXED' ? 'AMOUNT' : discountTypeRaw;

    return {
      code: raw?.code ?? '',
      is_valid: Boolean(raw?.is_valid ?? raw?.isValid ?? false),
      reason: raw?.reason,
      discount_type: normalizedDiscountType,
      value: Number(raw?.value ?? 0),
      discount_amount: Number(raw?.discount_amount ?? raw?.discountAmount ?? 0),
      total_after_discount: Number(raw?.total_after_discount ?? raw?.totalAfterDiscount ?? 0)
    };
  }

  /**
   * Xử lý lỗi API
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Không thể kiểm tra mã giảm giá.';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Lỗi: ${error.error.message}`;
    } else {
      if (error.status === 400) {
        errorMessage = error.error?.message || 'Mã giảm giá không hợp lệ.';
      } else if (error.status === 404) {
        errorMessage = 'Mã giảm giá không tồn tại.';
      } else {
        errorMessage = error.error?.message || `Lỗi: ${error.status}`;
      }
    }
    
    console.error('CouponService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
