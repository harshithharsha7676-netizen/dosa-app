import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order, OrderRequest, PlaceOrderResponse, DashboardStats } from '../models/models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  placeOrder(req: OrderRequest): Observable<PlaceOrderResponse> {
    return this.http.post<PlaceOrderResponse>(`${this.api}/orders/client`, req);
  }

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.api}/orders`);
  }

  getTodayOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.api}/orders/today`);
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.api}/orders/dashboard`);
  }

  updateStatus(id: number, status: string): Observable<Order> {
    return this.http.put<Order>(`${this.api}/orders/${id}/status`, { status });
  }

  togglePaid(id: number): Observable<Order> {
    return this.http.put<Order>(`${this.api}/orders/${id}/paid`, {});
  }
}
