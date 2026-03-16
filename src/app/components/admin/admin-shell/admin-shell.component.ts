import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './admin-shell.component.html',
  styleUrls: ['./admin-shell.component.scss']
})
export class AdminShellComponent implements OnInit, OnDestroy {
  username = '';
  private sub!: Subscription;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.sub = this.auth.username$.subscribe(u => (this.username = u));
    // Make body full-width for admin
    document.body.classList.add('admin-mode');
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    document.body.classList.remove('admin-mode');
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.toast.info('Logged out successfully');
        // Clear any cached form data
        sessionStorage.clear();
        this.router.navigate(['/admin/login']);
      },
      error: () => {
        sessionStorage.clear();
        this.router.navigate(['/admin/login']);
      }
    });
  }
}
