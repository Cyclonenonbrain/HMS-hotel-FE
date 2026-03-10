import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-room-types',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-types.component.html',
  styleUrl: './room-types.component.css'
})
export class RoomTypesComponent {
  roomTypes = [
    { id: 'RT01', name: 'Standard Room', description: 'Basic amenities, 1 King Bed', price: 100, capacity: 2, status: 'Active' },
    { id: 'RT02', name: 'Deluxe Room', description: 'City view, 2 Queen Beds', price: 150, capacity: 4, status: 'Active' },
    { id: 'RT03', name: 'Suite', description: 'Living area, Ocean view, 1 King Bed', price: 250, capacity: 2, status: 'Maintenance' },
    { id: 'RT04', name: 'Family Room', description: 'Spacious, 2 King Beds, 1 Sofa Bed', price: 200, capacity: 6, status: 'Active' },
    { id: 'RT05', name: 'Penthouse', description: 'Top floor, Panoramic view, 2 Master Bedrooms', price: 500, capacity: 4, status: 'Active' }
  ];
}
