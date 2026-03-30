import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { breadcrumb: 'Dashboard' }
      },
      {
        path: 'room-types',
        loadComponent: () => import('./room-types/room-types.component').then(m => m.RoomTypesComponent),
        data: { breadcrumb: 'Room Types' }
      },
      {
        path: 'rooms',
        loadComponent: () => import('./rooms/rooms.component').then(m => m.RoomsComponent),
        data: { breadcrumb: 'Rooms' }
      },
      {
        path: 'services',
        loadComponent: () => import('./services/services.component').then(m => m.ServicesComponent),
        data: { breadcrumb: 'Services' }
      },
      {
        path: 'pricing',
        loadComponent: () => import('./pricing/pricing.component').then(m => m.PricingComponent),
        data: { breadcrumb: 'Pricing Rules' }
      },
      {
        path: 'coupons',
        loadComponent: () => import('./coupons/coupons.component').then(m => m.CouponsComponent),
        data: { breadcrumb: 'Coupons' }
      },
      {
        path: 'users',
        loadComponent: () => import('./users/users.component').then(m => m.UsersComponent),
        data: { breadcrumb: 'Users' }
      },
      {
        path: 'reviews',
        loadComponent: () => import('./reviews/reviews.component').then(m => m.ReviewsComponent),
        data: { breadcrumb: 'Reviews' }
      }
    ]
  }
];
