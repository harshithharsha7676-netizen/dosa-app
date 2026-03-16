import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../services/order.service';
import { ToastService } from '../../../services/toast.service';
import { Order, OrderItem, OrderStatus } from '../../../models/models';
import { OrderCountPipe } from '../../../pipes/order-count.pipe';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, OrderCountPipe],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit, OnDestroy {
  allOrders:      Order[] = [];
  todayOrders:    Order[] = [];
  historyOrders:  Order[] = [];
  filteredOrders: Order[] = [];
  loading = true;
  lastRefreshed = new Date();
  activeView: 'today' | 'history' = 'today';
  activeFilter     = 'ALL';
  activePaidFilter = 'ALL';
  searchQuery      = '';
  parcelFirst      = true;        // ← read from localStorage every load
  hideRevenue      = true;
  hideTodayTotal   = true;
  private interval!: ReturnType<typeof setInterval>;

  statuses: OrderStatus[] = ['PENDING','CONFIRMED','PREPARING','READY','DELIVERED','CANCELLED'];
  filters = ['ALL', ...this.statuses];

  constructor(private orderService: OrderService, private toast: ToastService) {}

  ngOnInit(): void {
    this.parcelFirst = localStorage.getItem('dosa_parcelFirst') !== 'false';
    this.load();
    this.interval = setInterval(() => this.silentLoad(), 30_000);
  }
  ngOnDestroy(): void { clearInterval(this.interval); }

  load(): void {
    this.loading = true;
    // Re-read parcelFirst on every explicit load so it picks up Settings changes
    this.parcelFirst = localStorage.getItem('dosa_parcelFirst') !== 'false';
    this.orderService.getAllOrders().subscribe({
      next: orders => { this.ingest(orders); this.loading = false; },
      error: () => { this.toast.error('Failed to load orders'); this.loading = false; }
    });
  }

  silentLoad(): void {
    this.orderService.getAllOrders().subscribe({ next: orders => this.ingest(orders) });
  }

  private ingest(orders: Order[]): void {
    this.allOrders = orders;
    const todayStr = new Date().toDateString();
    this.todayOrders   = orders.filter(o => new Date(o.createdAt).toDateString() === todayStr);
    this.historyOrders = orders.filter(o => new Date(o.createdAt).toDateString() !== todayStr);
    this.lastRefreshed = new Date();
    this.applyFilters();
  }

  get sourceOrders(): Order[] {
    return this.activeView === 'today' ? this.todayOrders : this.historyOrders;
  }

  applyFilters(): void {
    let r = [...this.sourceOrders];
    if (this.activeFilter !== 'ALL')           r = r.filter(o => o.status === this.activeFilter);
    if (this.activePaidFilter === 'PAID')       r = r.filter(o => o.paid);
    if (this.activePaidFilter === 'UNPAID')     r = r.filter(o => !o.paid);
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase().replace(/^#/, '');
      const exact = r.filter(o => String(o.dailyOrderNumber || o.id) === q);
      if (exact.length) { this.filteredOrders = exact; return; }
      r = r.filter(o => {
        if (o.customerName?.toLowerCase().includes(q))  return true;
        if (o.customerPhone?.includes(q))               return true;
        if (String(o.dailyOrderNumber||o.id).includes(q)) return true;
        if (o.tableNumber?.toLowerCase().includes(q))   return true;
        if ((o.orderItems||[]).some(oi => (oi.itemName||oi.menuItem?.name||'').toLowerCase().includes(q))) return true;
        const d  = new Date(o.createdAt);
        const ds = d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}).toLowerCase();
        return ds.includes(q) || d.toLocaleDateString('en-IN',{month:'long'}).toLowerCase().includes(q);
      });
    }
    this.filteredOrders = r;
  }

  switchView(v: 'today'|'history'): void {
    this.activeView = v; this.activeFilter = 'ALL'; this.activePaidFilter = 'ALL'; this.searchQuery = '';
    this.applyFilters();
  }
  applyFilter(f: string):     void { this.activeFilter = f;     this.applyFilters(); }
  applyPaidFilter(f: string): void { this.activePaidFilter = f; this.applyFilters(); }

  get hasActiveFilter(): boolean {
    return !!this.searchQuery || this.activeFilter !== 'ALL' || this.activePaidFilter !== 'ALL';
  }
  clearAllFilters(): void {
    this.searchQuery = ''; this.activeFilter = 'ALL'; this.activePaidFilter = 'ALL'; this.applyFilters();
  }

  updateStatus(order: Order, event: Event): void {
    const status = (event.target as HTMLSelectElement).value;
    this.orderService.updateStatus(order.id, status).subscribe({
      next: updated => { order.status = updated.status; this.toast.success(`#${order.dailyOrderNumber||order.id} → ${status}`); this.applyFilters(); },
      error: () => this.toast.error('Failed to update status')
    });
  }

  togglePaid(order: Order): void {
    this.orderService.togglePaid(order.id).subscribe({
      next: updated => { order.paid = updated.paid; this.toast.success(order.paid ? '💚 Marked Paid' : '🔴 Marked Unpaid'); this.applyFilters(); },
      error: () => this.toast.error('Failed to update payment')
    });
  }

  parcelItems(o: Order): OrderItem[] { return (o.orderItems||[]).filter(oi =>  oi.parcel); }
  dineInItems(o: Order): OrderItem[] { return (o.orderItems||[]).filter(oi => !oi.parcel); }
  hasParcel(o: Order): boolean { return this.parcelItems(o).length > 0; }
  hasDineIn(o: Order): boolean { return this.dineInItems(o).length > 0; }
  totalQty(o: Order):  number  { return (o.orderItems||[]).reduce((s,oi)=>s+oi.quantity, 0); }
  parcelQty(o: Order): number  { return this.parcelItems(o).reduce((s,oi)=>s+oi.quantity,0); }
  dineInQty(o: Order): number  { return this.dineInItems(o).reduce((s,oi)=>s+oi.quantity,0); }
  parcelSubtotal(o: Order): number { return this.parcelItems(o).reduce((s,oi)=>s+this.n(oi.unitPrice)*oi.quantity,0); }
  dineInSubtotal(o: Order): number { return this.dineInItems(o).reduce((s,oi)=>s+this.n(oi.unitPrice)*oi.quantity,0); }

  statusClass(s: string): string {
    return ({PENDING:'yellow',CONFIRMED:'blue',PREPARING:'orange',READY:'green',DELIVERED:'gray',CANCELLED:'red'} as any)[s] ?? 'gray';
  }
  formatDate(d: string): string {
    return new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }
  formatTime(d: string): string { return new Date(d).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}); }
  formatRefresh(): string { return this.lastRefreshed.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'}); }
  n(v: any): number { return v != null ? Number(v) : 0; }

  // ── REVENUE ─────────────────────────────────────────────
  // "Revenue (filtered)" = exactly what's on screen including CANCELLED — so clicking CANCELLED shows those totals
  get filteredRevenue(): number {
    return this.filteredOrders.reduce((s,o) => s + this.n(o.totalAmount), 0);
  }
  // "Today's Total" = all today orders EXCLUDING cancelled always
  get todayRevenue(): number {
    return this.todayOrders.filter(o => o.status !== 'CANCELLED').reduce((s,o) => s + this.n(o.totalAmount), 0);
  }
  get paidCount():          number { return this.sourceOrders.filter(o => o.paid).length; }
  get unpaidCount():        number { return this.sourceOrders.filter(o => !o.paid).length; }
  get filteredItemCount():  number { return this.filteredOrders.reduce((s,o)=>s+this.totalQty(o),0); }
}
