import { Routes } from '@angular/router';
import { StaffLayoutComponent } from './layout/staff-layout.component';

export const staffRoutes: Routes = [
  {
    path: '',
    component: StaffLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/staff-dashboard.component').then(
            (m) => m.StaffDashboardComponent
          )
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./bookings/staff-bookings.component').then(
            (m) => m.StaffBookingsComponent
          )
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

