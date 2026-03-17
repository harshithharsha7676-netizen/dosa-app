import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/client/client.component').then(m => m.ClientComponent)
  },
  {
    // Remove standalone login page — redirect to home where Settings > Admin login is
    path: 'admin/login',
    redirectTo: '/',
    pathMatch: 'full'
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./components/admin/admin-shell/admin-shell.component').then(m => m.AdminShellComponent),
   // canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'menu',
        loadComponent: () =>
          import('./components/admin/menu/menu.component').then(m => m.MenuComponent)
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./components/admin/orders/orders.component').then(m => m.OrdersComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
