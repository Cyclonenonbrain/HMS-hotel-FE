import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { RoomListComponent } from './pages/search&filter/search&filter.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';

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
    { path: '', component: LandingPageComponent },
    { path: 'search', component: RoomListComponent },
    { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },
];
