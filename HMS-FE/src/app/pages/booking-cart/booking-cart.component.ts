import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BookingCartItem, BookingCartService } from '../../services/booking-cart.service';
import { VndPipe } from '../../core/vnd.pipe';
import { AuthService } from '../../services/auth.services';

@Component({
  selector: 'app-booking-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, VndPipe],
  templateUrl: './booking-cart.component.html'
})
export class BookingCartComponent implements OnInit, OnDestroy {
  items: BookingCartItem[] = [];
  user: any = null;
  isLoggedIn = false;
  private authSub!: Subscription;

  constructor(
    private cartService: BookingCartService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.items = this.cartService.getItems();
    this.authSub = this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
      if (status) {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          this.user = {
            ...parsedUser,
            fullName: parsedUser.full_name || parsedUser.fullName
          };
        }
      } else {
        this.user = null;
      }
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.authSub) this.authSub.unsubscribe();
  }

  onGuestsChange(index: number, guests: number) {
    this.cartService.updateGuests(index, guests);
    this.items = this.cartService.getItems();
  }

  remove(index: number) {
    this.cartService.removeAt(index);
    this.items = this.cartService.getItems();
  }

  get nights(): number {
    if (!this.items.length) return 1;
    const first = this.items[0];
    const start = new Date(first.checkIn);
    const end = new Date(first.checkOut);
    const diff = end.getTime() - start.getTime();
    return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 1);
  }

  get subTotal(): number {
    return this.items.reduce((sum, item) => sum + (item.price * this.nights), 0);
  }

  get tax(): number {
    return Math.round(this.subTotal * 0.08);
  }

  get total(): number {
    return this.subTotal + this.tax;
  }

  proceedCheckout() {
    if (!this.items.length) return;
    this.router.navigate(['/checkout'], { queryParams: { fromCart: '1' } });
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
