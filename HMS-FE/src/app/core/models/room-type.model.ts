export interface RoomTypeResponse {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  capacity: number;
  bedConfig?: string | null;
  amenities?: Array<{ id?: number; code: string; name: string; iconUrl?: string }>;
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
  amenityIds?: number[];
}
