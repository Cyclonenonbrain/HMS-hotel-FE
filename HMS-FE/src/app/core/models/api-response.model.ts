export interface ApiResponse<T> {
  code?: string;
  message?: string;
  data: T;
  success?: boolean;
  status?: string | number;
  timestamp?: string;
}

export interface PagedData<T> {
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  content: T[];
  first?: boolean;
  last?: boolean;
}
