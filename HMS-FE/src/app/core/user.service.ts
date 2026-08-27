import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { ApiResponse } from './models/api-response.model';
import { AdminUserCreateRequest, AdminUserQuery, AdminUserResponse, AdminUserUpdateRequest, PageResponse, UserRole } from './models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  getUsers(query?: AdminUserQuery): Observable<ApiResponse<PageResponse<AdminUserResponse>>> {
    let params = new HttpParams();
    if (query?.page !== undefined) params = params.set('page', query.page);
    if (query?.size !== undefined) params = params.set('size', query.size);

    return this.http.get<ApiResponse<any>>(this.apiUrl, { params }).pipe(
      map((res) => ({
        ...res,
        data: this.mapPageResponse(res.data)
      }))
    );
  }

  createUser(request: AdminUserCreateRequest): Observable<ApiResponse<AdminUserResponse>> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, this.toCreateRequest(request)).pipe(
      map((res) => ({
        ...res,
        data: this.mapUserResponse(res.data)
      }))
    );
  }

  updateUser(id: string, request: AdminUserUpdateRequest): Observable<ApiResponse<AdminUserResponse>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, this.toUpdateRequest(request)).pipe(
      map((res) => ({
        ...res,
        data: this.mapUserResponse(res.data)
      }))
    );
  }

  deleteUser(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  private mapPageResponse(page: any): PageResponse<AdminUserResponse> {
    const content = page?.content || (Array.isArray(page) ? page : []);
    return {
      content: content.map((item: any) => this.mapUserResponse(item)),
      totalElements: Number(page?.totalElements ?? content.length),
      totalPages: Number(page?.totalPages ?? 1),
      size: Number(page?.size ?? content.length),
      number: Number(page?.number ?? page?.page ?? 0),
      first: !!page?.first,
      last: !!page?.last
    };
  }

  private mapUserResponse(item: any): AdminUserResponse {
    const roleList = Array.from(item?.roles || []);
    const role = roleList.length > 0 ? roleList[0] : (item?.role || 'CUSTOMER');
    return {
      id: String(item?.id ?? ''),
      email: item?.email ?? '',
      fullName: item?.fullName ?? item?.full_name ?? item?.username ?? '',
      phone: item?.phone ?? null,
      role: role as UserRole,
      isActive: Boolean(item?.isActive ?? item?.is_active ?? true),
      createdAt: item?.createdAt ?? item?.created_at ?? '',
      updatedAt: item?.updatedAt ?? item?.updated_at ?? ''
    };
  }

  private toCreateRequest(request: AdminUserCreateRequest): any {
    const username = request.email ? request.email.split('@')[0] : 'user_' + Date.now();
    return {
      username: username.length >= 4 ? username : username + '_usr',
      email: request.email,
      password: request.password,
      fullName: request.fullName,
      roles: [request.role || 'CUSTOMER']
    };
  }

  private toUpdateRequest(request: AdminUserUpdateRequest): any {
    return {
      email: request.email,
      password: request.password ? request.password : undefined,
      fullName: request.fullName,
      isActive: request.isActive !== undefined ? request.isActive : true,
      roles: [request.role || 'CUSTOMER']
    };
  }
}
