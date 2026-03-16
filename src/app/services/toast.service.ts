import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  toasts$ = new BehaviorSubject<Toast[]>([]);

  show(message: string, type: Toast['type'] = 'info'): void {
    const id = ++this.counter;
    const current = this.toasts$.value;
    this.toasts$.next([...current, { id, message, type }]);
    setTimeout(() => this.remove(id), 3500);
  }

  success(msg: string) { this.show(msg, 'success'); }
  error(msg: string)   { this.show(msg, 'error'); }
  info(msg: string)    { this.show(msg, 'info'); }

  remove(id: number): void {
    this.toasts$.next(this.toasts$.value.filter(t => t.id !== id));
  }
}
