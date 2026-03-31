export interface AmenityResponse {
  id: string;
  code: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface AmenityCreateRequest {
  code: string;
  name: string;
}
