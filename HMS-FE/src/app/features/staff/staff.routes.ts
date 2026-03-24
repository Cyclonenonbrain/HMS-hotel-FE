import { Routes } from '@angular/router';
import { StaffLayoutComponent } from './layout/staff-layout.component';
import { StaffDashboardComponent } from './dashboard/staff-dashboard.component';
import { StaffBookingsComponent } from './bookings/staff-bookings.component';
import { StaffBillingComponent } from './billing/staff-billing.component';

export const staffRoutes: Routes = [
  {
    path: '',
    component: StaffLayoutComponent,
    children: [
      { path: 'dashboard', component: StaffDashboardComponent },
      { path: 'bookings', component: StaffBookingsComponent },
      { path: 'billing', component: StaffBillingComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
