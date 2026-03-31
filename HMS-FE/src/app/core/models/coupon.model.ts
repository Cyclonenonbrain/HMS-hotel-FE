export type DiscountType = 'PERCENT' | 'FIXED';

export interface CouponResponse {
  id: string;
  code: string;
  discountType: DiscountType;
  value: number;
  maxUsage: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  isExpired: boolean;
  isUsageLimitReached: boolean;
  createdAt: string;
}

export interface CouponCreateRequest {
  code: string;
  discountType: DiscountType;
  value: number;
  maxUsage: number | null;
  expiresAt: string | null;
  isActive: boolean;
}

export interface CouponQuery {
  page?: number;
  size?: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
