export interface RoomTypeResponse {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  capacity: number;
  bedConfig?: string | null;
  amenities?: Array<{ code: string; name: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomTypeCreateRequest {
  name: string;
  description: string;
  basePrice: number;
  capacity: number;
  bedConfig?: string | null;
  amenities?: string[];
}
