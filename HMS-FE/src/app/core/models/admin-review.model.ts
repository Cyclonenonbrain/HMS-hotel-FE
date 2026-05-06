export interface AdminReviewResponse {
  id: string;
  bookingId: string | null;
  roomId: string | null;
  userId: string | null;
  userName: string | null;
  rating: number;
  comment: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReviewQuery {
  q?: string;
  rating?: number;
  isVisible?: boolean;
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
