import { Injectable } from '@angular/core';

export interface BookingCartItem {
  roomTypeId: string;
  roomName: string;
  roomType: string;
  price: number;
  image: string;
  capacity: number;
  guests: number;
  checkIn: string;
  checkOut: string;
}

@Injectable({ providedIn: 'root' })
export class BookingCartService {
  private readonly storageKey = 'booking_cart_items';

  getItems(): BookingCartItem[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as BookingCartItem[]) : [];
    } catch {
      return [];
    }
  }

  addItem(item: BookingCartItem): void {
    const items = this.getItems();
    const existingIndex = items.findIndex(
      x => x.roomTypeId === item.roomTypeId && x.checkIn === item.checkIn && x.checkOut === item.checkOut
    );

    if (existingIndex >= 0) {
      items[existingIndex].guests = Math.max(items[existingIndex].guests, item.guests);
    } else {
      items.push(item);
    }

    this.saveItems(items);
  }

  updateGuests(index: number, guests: number): void {
    const items = this.getItems();
    if (!items[index]) return;
    items[index].guests = Math.max(1, guests);
    this.saveItems(items);
  }

  removeAt(index: number): void {
    const items = this.getItems();
    if (index < 0 || index >= items.length) return;
    items.splice(index, 1);
    this.saveItems(items);
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }

  private saveItems(items: BookingCartItem[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }
}
