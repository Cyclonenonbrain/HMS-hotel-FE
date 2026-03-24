import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { RoomListComponent } from './pages/search&filter/search&filter.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { BookingConfirmationComponent } from './pages/payment/booking-confirmation.component';
import { RoomDetailComponent } from './pages/rooms/room-details.component';

import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
    canActivate: [authGuard, roleGuard],
    data: { expectedRoles: ['ADMIN'] }
  },
  {
    path: 'staff',
    loadChildren: () => import('./features/staff/staff.routes').then(m => m.staffRoutes),
    canActivate: [authGuard, roleGuard],
    data: { expectedRoles: ['STAFF', 'ADMIN'] }
  },
  { path: '', component: LandingPageComponent },
  { path: 'search', component: RoomListComponent },
  { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },
  { path: 'booking-confirmation/:id', component: BookingConfirmationComponent, canActivate: [authGuard] },
  {
    path: 'room-detail/:id',
    loadComponent: () => import('./pages/rooms/room-details.component').then(m => m.RoomDetailComponent)
  },
];
