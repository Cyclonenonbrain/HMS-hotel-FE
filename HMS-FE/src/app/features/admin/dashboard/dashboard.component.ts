import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';
import {
  AdminAnalyticsService,
  DashboardMetrics,
  OccupancySnapshot,
  RevenueBreakdown
} from '../../../services/admin-analytics.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  isLoading = true;
  loadError = '';
  revenueError = '';
  occupancyError = '';

  metrics: DashboardMetrics | null = null;
  revenueSeries: RevenueBreakdown[] = [];
  occupancyByRoomType: OccupancySnapshot[] = [];

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.loadError = '';
    this.revenueError = '';
    this.occupancyError = '';

    forkJoin({
      dashboard: this.analyticsService.getDashboard(30),
      revenue: this.analyticsService.getRevenue('MONTHLY').pipe(
        catchError(() => {
          this.revenueError = 'Revenue data is temporarily unavailable.';
          return of({ success: false, message: 'Revenue unavailable', data: [] as RevenueBreakdown[] });
        })
      ),
      occupancy: this.analyticsService.getRoomOccupancy().pipe(
        catchError(() => {
          this.occupancyError = 'Occupancy data is temporarily unavailable.';
          return of({ success: false, message: 'Occupancy unavailable', data: [] as OccupancySnapshot[] });
        })
      )
    }).subscribe({
      next: ({ dashboard, revenue, occupancy }) => {
        this.metrics = dashboard?.data ?? null;
        this.revenueSeries = revenue?.data ?? [];
        this.occupancyByRoomType = occupancy?.data ?? [];
        this.isLoading = false;
      },
      error: (err) => {
        this.loadError = err?.error?.message || 'Failed to load admin dashboard data.';
        this.isLoading = false;
      }
    });
  }

  toNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined) return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  formatCurrency(value: number | string | null | undefined): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(this.toNumber(value));
  }

  formatCompactCurrency(value: number | string | null | undefined): string {
    const n = this.toNumber(value);
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return `${Math.round(n)}`;
  }

  formatPercent(value: number | string | null | undefined): string {
    return `${Math.round(this.toNumber(value))}%`;
  }

  get chartSeries(): RevenueBreakdown[] {
    return [...this.revenueSeries]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);
  }

  get monthLabels(): string[] {
    return this.chartSeries.map(item =>
      new Intl.DateTimeFormat('vi-VN', { month: 'short' }).format(new Date(item.date))
    );
  }

  get yAxisLabels(): string[] {
    const max = Math.max(...this.chartSeries.map(x => this.toNumber(x.dailyRevenue)), 0);
    return [max, max * 0.66, max * 0.33, 0].map(x => this.formatCompactCurrency(x));
  }

  get revenuePath(): string {
    const points = this.chartSeries.map((item, idx) => {
      const x = this.chartSeries.length > 1 ? (idx / (this.chartSeries.length - 1)) * 100 : 0;
      const max = Math.max(...this.chartSeries.map(s => this.toNumber(s.dailyRevenue)), 1);
      const y = 100 - (this.toNumber(item.dailyRevenue) / max) * 90;
      return `${x},${Math.max(5, Math.min(95, y))}`;
    });
    if (!points.length) return '';
    return `M${points.join(' L')}`;
  }

  get revenueAreaPath(): string {
    if (!this.revenuePath) return '';
    return `${this.revenuePath} L100,100 L0,100 Z`;
  }

  get revenuePointPositions(): Array<{ x: number; y: number }> {
    const max = Math.max(...this.chartSeries.map(s => this.toNumber(s.dailyRevenue)), 1);
    return this.chartSeries.map((item, idx) => ({
      x: this.chartSeries.length > 1 ? (idx / (this.chartSeries.length - 1)) * 100 : 0,
      y: Math.max(5, Math.min(95, 100 - (this.toNumber(item.dailyRevenue) / max) * 90))
    }));
  }

  get occupancyTotalPercent(): number {
    const totalRooms = this.occupancyByRoomType.reduce((sum, item) => sum + (item.totalRooms || 0), 0);
    const occupiedRooms = this.occupancyByRoomType.reduce((sum, item) => sum + (item.occupiedRooms || 0), 0);
    if (totalRooms > 0) return Math.round((occupiedRooms / totalRooms) * 100);
    return Math.round(this.toNumber(this.metrics?.occupancyRate));
  }

  get occupancyLegend(): Array<{ name: string; percent: number; colorClass: string }> {
    const totalRooms = this.occupancyByRoomType.reduce((sum, item) => sum + (item.totalRooms || 0), 0);
    if (totalRooms <= 0) return [];

    const colors = [
      'bg-primary',
      'bg-slate-800 dark:bg-slate-300',
      'bg-slate-400 dark:bg-slate-600',
      'bg-primary/50'
    ];

    return this.occupancyByRoomType.slice(0, 4).map((item, index) => ({
      name: item.roomTypeName,
      percent: Math.round(((item.totalRooms || 0) / totalRooms) * 100),
      colorClass: colors[index] || 'bg-slate-300'
    }));
  }

  get occupancySlices(): Array<{ percent: number; offset: number; strokeClass: string }> {
    let offset = 0;
    return this.occupancyLegend.map((item, index) => {
      const slice = {
        percent: item.percent,
        offset,
        strokeClass: this.occupancyStrokeClass(index)
      };
      offset -= item.percent;
      return slice;
    });
  }

  occupancyStrokeClass(index: number): string {
    const classes = ['stroke-primary', 'stroke-slate-800 dark:stroke-slate-300', 'stroke-slate-400 dark:stroke-slate-600', 'stroke-primary/50'];
    return classes[index] || 'stroke-slate-300';
  }

  formatDateShort(value: string): string {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    }).format(new Date(value));
  }

  get recentRevenueRows(): RevenueBreakdown[] {
    return [...this.revenueSeries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }
}
