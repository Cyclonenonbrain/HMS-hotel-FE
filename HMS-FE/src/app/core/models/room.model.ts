export type RoomStatus = 'AVAILABLE' | 'BOOKED' | 'OCCUPIED' | 'DIRTY' | 'MAINTENANCE';

export interface RoomResponse {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  roomTypeName: string;
  roomTypeCapacity: number;
  roomTypeBasePrice: number;
  status: RoomStatus;
  floor: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomCreateRequest {
  roomNumber: string;
  roomTypeId: string;
  status: RoomStatus;
  floor: number;
}

export interface RoomQuery {
  roomTypeId?: string;
  status?: RoomStatus;
  floor?: number;
}
