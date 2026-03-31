import { Routes } from '@angular/router';
import { StaffLayoutComponent } from './layout/staff-layout.component';
import { StaffBookingsComponent } from './bookings/staff-bookings.component';
import { StaffBillingComponent } from './billing/staff-billing.component';

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
      { path: 'bookings', component: StaffBookingsComponent },
      { path: 'billing', component: StaffBillingComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

