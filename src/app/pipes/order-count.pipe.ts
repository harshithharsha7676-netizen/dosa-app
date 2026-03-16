import { Pipe, PipeTransform } from '@angular/core';
import { Order } from '../models/models';

@Pipe({ name: 'orderCount', standalone: true })
export class OrderCountPipe implements PipeTransform {
  transform(orders: Order[], status: string): number {
    return orders.filter(o => o.status === status).length;
  }
}
