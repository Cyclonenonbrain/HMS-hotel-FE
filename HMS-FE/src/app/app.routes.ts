import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';

export const routes: Routes = [
    {path: 'login', component: LoginComponent},
    { path: 'register', component: RegisterComponent },
    { path: '', component: LandingPageComponent },
    {path: '', redirectTo: 'login', pathMatch: 'full'} // Điều hướng mặc định đến trang login
];
