export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface AdminUserResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserCreateRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
}

export interface AdminUserUpdateRequest {
  email?: string;
  password?: string;
  fullName?: string;
  phone?: string | null;
  role?: UserRole;
  isActive?: boolean;
}

export interface AdminUserQuery {
  q?: string;
  role?: UserRole;
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
