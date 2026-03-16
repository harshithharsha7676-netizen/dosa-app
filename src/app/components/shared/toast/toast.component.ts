import { Component } from '@angular/core';
import { AsyncPipe, NgClass, NgFor } from '@angular/common';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgClass],
  template: `
    <div class="toast-container">
      <div *ngFor="let t of toast.toasts$ | async"
           class="toast" [ngClass]="t.type"
           (click)="toast.remove(t.id)">
        {{ t.message }}
      </div>
    </div>
  `
})
export class ToastComponent {
  constructor(public toast: ToastService) {}
}
