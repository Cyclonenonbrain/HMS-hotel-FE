import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';

export const routes: Routes = [
    {path: 'login', component: LoginComponent},
    { path: 'register', component: RegisterComponent },
    { path: 'admin/dashboard', loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
    { path: '', component: LandingPageComponent }
];
