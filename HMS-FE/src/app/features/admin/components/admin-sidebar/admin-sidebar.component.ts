import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminScrollbarComponent } from '../admin-scrollbar/admin-scrollbar.component';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, AdminScrollbarComponent],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css'
})
export class AdminSidebarComponent {
  isCollapsed = false;

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
}
