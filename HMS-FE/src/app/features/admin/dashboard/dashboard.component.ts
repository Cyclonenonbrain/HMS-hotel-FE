import { Component } from '@angular/core';
import { AdminHeaderComponent } from '../components/admin-header/admin-header.component';
import { AdminSidebarComponent } from '../components/admin-sidebar/admin-sidebar.component';
import { AdminScrollbarComponent } from '../components/admin-scrollbar/admin-scrollbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AdminHeaderComponent, AdminSidebarComponent, AdminScrollbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

}
