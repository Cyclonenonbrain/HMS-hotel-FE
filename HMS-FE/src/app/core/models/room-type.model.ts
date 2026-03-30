export interface RoomTypeResponse {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  capacity: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomTypeCreateRequest {
  name: string;
  description: string;
  basePrice: number;
  capacity: number;
}
