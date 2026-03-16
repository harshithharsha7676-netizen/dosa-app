import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MenuItem } from '../models/models';

// Each cart line = item + whether it's parcel + quantity
export interface CartLine {
  menuItem:  MenuItem;
  quantity:  number;
  isParcel:  boolean;
  key:       string;   // `${menuItem.id}_${isParcel}`
}

@Injectable({ providedIn: 'root' })
export class CartService {
  // Keyed by `${id}_parcel` or `${id}_dinein`
  private lines = new Map<string, CartLine>();
  cart$ = new BehaviorSubject<CartLine[]>([]);

  private key(id: number, parcel: boolean): string {
    return `${id}_${parcel ? 'p' : 'd'}`;
  }

  /** Add qty=1 to a specific (item, parcel) line */
  addLine(menuItem: MenuItem, isParcel: boolean): void {
    const k = this.key(menuItem.id, isParcel);
    const ex = this.lines.get(k);
    if (ex) {
      ex.quantity++;
    } else {
      this.lines.set(k, { menuItem, quantity: 1, isParcel, key: k });
    }
    this.emit();
  }

  /** Decrement qty=1 from a (item, parcel) line */
  removeLine(menuItemId: number, isParcel: boolean): void {
    const k = this.key(menuItemId, isParcel);
    const ex = this.lines.get(k);
    if (!ex) return;
    if (ex.quantity > 1) {
      ex.quantity--;
    } else {
      this.lines.delete(k);
    }
    this.emit();
  }

  /** Delete an entire line */
  deleteLine(key: string): void {
    this.lines.delete(key);
    this.emit();
  }

  /** Total qty of an item regardless of parcel/dine-in */
  getTotalQtyForItem(menuItemId: number): number {
    const p = this.lines.get(this.key(menuItemId, true));
    const d = this.lines.get(this.key(menuItemId, false));
    return (p?.quantity ?? 0) + (d?.quantity ?? 0);
  }

  getParcelQty(menuItemId: number): number {
    return this.lines.get(this.key(menuItemId, true))?.quantity ?? 0;
  }

  getDineInQty(menuItemId: number): number {
    return this.lines.get(this.key(menuItemId, false))?.quantity ?? 0;
  }

  getLines(): CartLine[] {
    return Array.from(this.lines.values());
  }

  clear(): void {
    this.lines.clear();
    this.emit();
  }

  private emit(): void {
    this.cart$.next(Array.from(this.lines.values()));
  }
}
