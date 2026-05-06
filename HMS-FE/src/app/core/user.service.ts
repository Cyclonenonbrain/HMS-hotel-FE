import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { ApiResponse } from './models/api-response.model';
import { AdminUserCreateRequest, AdminUserQuery, AdminUserResponse, AdminUserUpdateRequest, PageResponse } from './models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/admin/users`;
  private readonly fallbackApiUrl = `${environment.apiUrl}/admin/user`;

  constructor(private http: HttpClient) {}

  getUsers(query?: AdminUserQuery): Observable<ApiResponse<PageResponse<AdminUserResponse>>> {
    let params = new HttpParams();
    if (query?.q) params = params.set('q', query.q);
    if (query?.role) params = params.set('role', query.role);
    if (query?.isActive !== undefined) params = params.set('is_active', query.isActive);
    if (query?.page !== undefined) params = params.set('page', query.page);
    if (query?.size !== undefined) params = params.set('size', query.size);
    if (query?.sort) params = params.set('sort', query.sort);

    return this.http.get<ApiResponse<any>>(this.apiUrl, { params }).pipe(
      map((res) => ({
        ...res,
        data: this.mapPageResponse(res.data)
      })),
      catchError((error) => {
        if (error?.status !== 404) return throwError(() => error);
        return this.http.get<ApiResponse<any>>(this.fallbackApiUrl, { params }).pipe(
          map((res) => ({
            ...res,
            data: this.mapPageResponse(res.data)
          }))
        );
      })
    );
  }

  createUser(request: AdminUserCreateRequest): Observable<ApiResponse<AdminUserResponse>> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, this.toCreateRequest(request)).pipe(
      map((res) => ({
        ...res,
        data: this.mapUserResponse(res.data)
      })),
      catchError((error) => {
        if (error?.status !== 404) return throwError(() => error);
        return this.http.post<ApiResponse<any>>(this.fallbackApiUrl, this.toCreateRequest(request)).pipe(
          map((res) => ({
            ...res,
            data: this.mapUserResponse(res.data)
          }))
        );
      })
    );
  }

  updateUser(id: string, request: AdminUserUpdateRequest): Observable<ApiResponse<AdminUserResponse>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, this.toUpdateRequest(request)).pipe(
      map((res) => ({
        ...res,
        data: this.mapUserResponse(res.data)
      })),
      catchError((error) => {
        if (error?.status !== 404) return throwError(() => error);
        return this.http.put<ApiResponse<any>>(`${this.fallbackApiUrl}/${id}`, this.toUpdateRequest(request)).pipe(
          map((res) => ({
            ...res,
            data: this.mapUserResponse(res.data)
          }))
        );
      })
    );
  }

  deleteUser(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        if (error?.status !== 404) return throwError(() => error);
        return this.http.delete<ApiResponse<void>>(`${this.fallbackApiUrl}/${id}`);
      })
    );
  }

  private mapPageResponse(page: any): PageResponse<AdminUserResponse> {
    return {
      content: (page?.content || []).map((item: any) => this.mapUserResponse(item)),
      totalElements: Number(page?.totalElements ?? 0),
      totalPages: Number(page?.totalPages ?? 0),
      size: Number(page?.size ?? 0),
      number: Number(page?.number ?? 0),
      first: !!page?.first,
      last: !!page?.last
    };
  }

  private mapUserResponse(item: any): AdminUserResponse {
    return {
      id: item?.id,
      email: item?.email ?? '',
      fullName: item?.fullName ?? item?.full_name ?? '',
      phone: item?.phone ?? null,
      role: item?.role ?? 'CUSTOMER',
      isActive: Boolean(item?.isActive ?? item?.is_active ?? false),
      createdAt: item?.createdAt ?? item?.created_at,
      updatedAt: item?.updatedAt ?? item?.updated_at
    };
  }

  private toCreateRequest(request: AdminUserCreateRequest): any {
    return {
      email: request.email,
      password: request.password,
      full_name: request.fullName,
      phone: request.phone,
      role: request.role,
      is_active: request.isActive
    };
  }

  private toUpdateRequest(request: AdminUserUpdateRequest): any {
    return {
      email: request.email,
      password: request.password,
      full_name: request.fullName,
      phone: request.phone,
      role: request.role,
      is_active: request.isActive
    };
  }
}
