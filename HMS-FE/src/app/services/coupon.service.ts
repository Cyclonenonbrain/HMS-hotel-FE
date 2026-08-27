import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface CouponValidationResponse {
  code: string;
  is_valid: boolean;
  validation_token?: string;
  discount_amount?: number;
  expires_at?: string;
  reason?: string;
  discount_type?: 'PERCENT' | 'AMOUNT' | 'FIXED';
  value?: number;
  total_after_discount?: number;
}

export interface ApiResponse<T> {
  code?: string;
  success?: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private readonly API_URL = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Validate coupon code
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
          success: response.code === '2001' || response.success === true,
          data: this.normalizeValidationResponse(code, currentTotal, response?.data)
        })),
        catchError(this.handleError)
      );
  }

  private normalizeValidationResponse(code: string, currentTotal: number, raw: any): CouponValidationResponse {
    const discountAmount = Number(raw?.discount_amount ?? raw?.discountAmount ?? 0);
    const isValid = Boolean(raw?.is_valid ?? raw?.valid ?? (discountAmount > 0));
    const token = raw?.validation_token ?? raw?.validationToken ?? '';
    const discountTypeRaw = raw?.discount_type ?? raw?.discountType ?? 'AMOUNT';
    const totalAfterDiscount = Math.max(0, currentTotal - discountAmount);

    return {
      code: raw?.coupon_code ?? raw?.couponCode ?? code,
      is_valid: isValid,
      validation_token: token,
      discount_amount: discountAmount,
      expires_at: raw?.expires_at ?? raw?.expiresAt,
      reason: raw?.reason ?? (isValid ? '' : 'Mã giảm giá không hợp lệ hoặc đã hết hạn'),
      discount_type: discountTypeRaw === 'FIXED' ? 'AMOUNT' : discountTypeRaw,
      value: Number(raw?.value ?? discountAmount),
      total_after_discount: totalAfterDiscount
    };
  }

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
