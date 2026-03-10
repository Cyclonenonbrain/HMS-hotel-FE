import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.css'
})
export class AdminHeaderComponent implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  
  currentBreadcrumb = 'Dashboard';

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.currentBreadcrumb = this.getBreadcrumb(this.activatedRoute.root);
      });
      
    // Initial set
    this.currentBreadcrumb = this.getBreadcrumb(this.activatedRoute.root);
  }

  private getBreadcrumb(route: ActivatedRoute): string {
    let breadcrumb = 'Dashboard';
    let currentRoute = route;

    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
      if (currentRoute.snapshot.data['breadcrumb']) {
        breadcrumb = currentRoute.snapshot.data['breadcrumb'];
      }
    }

    return breadcrumb;
  }
}
