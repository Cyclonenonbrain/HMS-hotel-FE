export interface HotelServiceResponse {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface HotelServiceCreateRequest {
  name: string;
  price: number;
  isActive: boolean;
}

export interface HotelServiceQuery {
  q?: string;
  isActive?: boolean;
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
