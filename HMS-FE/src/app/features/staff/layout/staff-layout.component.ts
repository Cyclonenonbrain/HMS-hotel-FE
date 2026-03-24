import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-staff-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="bg-background-light font-display text-slate-900 flex h-screen w-full overflow-hidden">
      <!-- Left Sidebar -->
      <div class="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 shrink-0 h-full">
        <div class="flex flex-col gap-4 p-4">
          <div class="flex gap-3 items-center mb-4 cursor-pointer" routerLink="/">
            <div class="bg-primary aspect-square rounded-full size-10 flex items-center justify-center text-slate-900 font-bold text-lg">L</div>
            <div class="flex flex-col">
              <h1 class="text-white text-base font-medium leading-normal">Luxecore</h1>
              <p class="text-primary text-sm font-normal leading-normal">Staff Portal</p>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <div routerLink="/staff/dashboard" routerLinkActive="bg-primary/10 text-primary" [routerLinkActiveOptions]="{exact: true}" class="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-800 hover:text-white text-slate-300">
              <span class="material-symbols-outlined text-[24px]">home</span>
              <p class="text-sm font-medium leading-normal">Front Desk</p>
            </div>
            <div routerLink="/staff/bookings" routerLinkActive="bg-primary/10 text-primary" class="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-800 text-slate-300 hover:text-white">
              <span class="material-symbols-outlined text-[24px]">calendar_month</span>
              <p class="text-sm font-medium leading-normal">Bookings</p>
            </div>
            <div routerLink="/staff/billing" routerLinkActive="bg-primary/10 text-primary" class="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-800 text-slate-300 hover:text-white">
              <span class="material-symbols-outlined text-[24px]">receipt_long</span>
              <p class="text-sm font-medium leading-normal">Billing</p>
            </div>
           
          </div>
        </div>
        <div class="p-4 border-t border-slate-800">
          <div class="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors hover:text-white text-slate-300" (click)="logout()">
            <span class="material-symbols-outlined text-[24px]">logout</span>
            <p class="text-sm font-medium leading-normal">Logout</p>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <router-outlet></router-outlet>
    </div>
  `,
  styles: []
})
export class StaffLayoutComponent {
  constructor(private router: Router) {}
  
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('userRole');
    this.router.navigate(['/login']);
  }
}
