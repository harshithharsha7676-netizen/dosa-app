import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../services/order.service';
import { DashboardStats, Order } from '../../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats: DashboardStats | null = null;
  todayOrders: Order[] = [];
  historyOrders: Order[] = [];
  loading = true;
  activeTab: 'today' | 'history' = 'today';
  parcelFirst = true;
  searchQuery = '';
  hideTodayRevenue = true;
  hideTotalRevenue = true;
  private interval!: ReturnType<typeof setInterval>;

  today = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.parcelFirst = localStorage.getItem('dosa_parcelFirst') !== 'false';
    this.load();
    this.interval = setInterval(() => this.load(), 30_000);
  }
  ngOnDestroy(): void { clearInterval(this.interval); }

  load(): void {
    this.loading = true;
    this.orderService.getDashboardStats().subscribe({
      next: s => { this.stats = s; this.loading = false; },
      error: () => { this.loading = false; }
    });
    this.orderService.getTodayOrders().subscribe({
      next: orders => { this.todayOrders = orders; }
    });
    this.orderService.getAllOrders().subscribe({
      next: all => {
        const todayStr = new Date().toDateString();
        this.historyOrders = all.filter(o => new Date(o.createdAt).toDateString() !== todayStr);
      }
    });
  }

  get displayedOrders(): Order[] {
    const src = this.activeTab === 'today' ? this.todayOrders : this.historyOrders;
    if (!this.searchQuery.trim()) return src;
    const q = this.searchQuery.toLowerCase();
    return src.filter(o =>
      o.customerName?.toLowerCase().includes(q) ||
      o.customerPhone?.includes(q) ||
      String(o.dailyOrderNumber||o.id).includes(q) ||
      o.tableNumber?.includes(q)
    );
  }

  // Today revenue excludes cancelled
  get todayRevenue(): number {
    return this.todayOrders.filter(o => o.status !== 'CANCELLED').reduce((s,o) => s + this.n(o.totalAmount), 0);
  }
  // Total revenue excludes cancelled
  get totalRevenue(): number {
    return [...this.todayOrders, ...this.historyOrders]
      .filter(o => o.status !== 'CANCELLED').reduce((s,o) => s + this.n(o.totalAmount), 0);
  }

  // ★ Item quantity count — total qty of all today order items
  get todayItemQty(): number {
    return this.todayOrders.reduce((s,o) => s + (o.orderItems||[]).reduce((q,oi) => q + oi.quantity, 0), 0);
  }

  get todayPaid(): number    { return this.todayOrders.filter(o => o.paid).length; }
  get todayPending(): number { return this.todayOrders.filter(o => o.status === 'PENDING').length; }

  statusClass(status: string): string {
    return ({PENDING:'yellow',CONFIRMED:'blue',PREPARING:'orange',READY:'green',DELIVERED:'gray',CANCELLED:'red'} as any)[status] ?? 'gray';
  }
  formatDate(d: string): string {
    return new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }
  formatTime(d: string): string { return new Date(d).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}); }

  parcelItems(o: Order) { return (o.orderItems||[]).filter(oi =>  oi.parcel); }
  dineInItems(o: Order) { return (o.orderItems||[]).filter(oi => !oi.parcel); }
  hasParcel(o: Order)  { return this.parcelItems(o).length > 0; }
  hasDineIn(o: Order)  { return this.dineInItems(o).length > 0; }
  n(v: any): number    { return v != null ? Number(v) : 0; }
}
