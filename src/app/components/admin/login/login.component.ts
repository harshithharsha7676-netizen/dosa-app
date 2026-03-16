import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { filter, take } from 'rxjs';
import { environment } from '../../../../environments/environment';

type LoginView = 'login' | 'forgot' | 'otp' | 'reset';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  view: LoginView = 'login';
  username = '';
  password = '';
  showPassword = false;
  loading  = false;
  error    = '';

  // Forgot password flow
  fpPhone   = '';
  fpOtp     = '';
  fpNew     = '';
  fpConfirm = '';
  fpLoading = false;
  fpError   = '';
  fpSuccess = '';
  adminWA   = '917676666246';

  private api = environment.apiUrl;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
    private http: HttpClient
  ) {
    this.auth.sessionChecked$
      .pipe(filter(c => c), take(1))
      .subscribe(() => {
        if (this.auth.isAuthenticated()) {
          this.router.navigate(['/admin/dashboard']);
        }
      });
  }

  ngOnInit(): void {
    document.body.classList.add('admin-mode');
    // Always start with empty fields
    this.username = '';
    this.password = '';
  }

  ngOnDestroy(): void {
    document.body.classList.remove('admin-mode');
  }

  login(): void {
    if (!this.username.trim() || !this.password.trim()) {
      this.error = 'Please fill in all fields';
      return;
    }
    this.loading = true;
    this.error   = '';

    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: res => {
        if (res.success) {
          this.toast.success('Welcome back, Admin!');
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.error   = 'Invalid username or password.';
          this.loading = false;
        }
      },
      error: (err) => {
        if (err.status === 401 || err.status === 403) {
          this.error = 'Invalid username or password.';
        } else if (err.status === 0 || err.status === 504) {
          this.error = 'Cannot connect to server. Ensure backend is running on port 8080.';
        } else {
          this.error = 'Invalid username or password.';
        }
        this.loading = false;
      }
    });
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }

  goForgot(): void {
    this.view = 'forgot';
    this.fpPhone = ''; this.fpOtp = ''; this.fpNew = ''; this.fpConfirm = '';
    this.fpError = ''; this.fpSuccess = '';
  }

  sendOtp(): void {
    const ph = this.fpPhone.replace(/\D/g, '');
    if (ph.length < 10) { this.fpError = 'Enter a valid 10-digit phone number'; return; }
    this.fpLoading = true; this.fpError = '';

    this.http.post<any>(`${this.api}/auth/otp/generate`, { phone: ph }).subscribe({
      next: res => {
        const text = encodeURIComponent(`Your Dosa Admin OTP: *${res.otp}*\nValid for 5 minutes. Do not share.`);
        window.location.href = `whatsapp://send?phone=${this.adminWA}&text=${text}`;
        this.view = 'otp';
        this.fpLoading = false;
      },
      error: () => { this.fpError = 'Server error. Is the backend running?'; this.fpLoading = false; }
    });
  }

  verifyOtp(): void {
    if (!this.fpOtp.trim()) { this.fpError = 'Please enter the OTP'; return; }
    this.fpLoading = true; this.fpError = '';

    this.http.post<any>(`${this.api}/auth/otp/verify`, {
      phone: this.fpPhone.replace(/\D/g, ''),
      otp:   this.fpOtp.trim()
    }).subscribe({
      next: res => {
        if (res.valid) { this.view = 'reset'; }
        else { this.fpError = res.reason || 'Invalid OTP. Please try again.'; }
        this.fpLoading = false;
      },
      error: () => { this.fpError = 'Server error.'; this.fpLoading = false; }
    });
  }

  saveNewPassword(): void {
    if (this.fpNew.length < 4)         { this.fpError = 'Minimum 4 characters required'; return; }
    if (this.fpNew !== this.fpConfirm) { this.fpError = 'Passwords do not match'; return; }
    this.fpLoading = true; this.fpError = '';

    this.http.post<any>(`${this.api}/auth/change-password`, { newPassword: this.fpNew }).subscribe({
      next: () => {
        this.fpSuccess = '✅ Password changed! You can now login.';
        this.fpLoading = false;
        setTimeout(() => { this.view = 'login'; }, 2500);
      },
      error: () => { this.fpError = 'Server error.'; this.fpLoading = false; }
    });
  }

  backToLogin(): void {
    this.view = 'login'; this.error = '';
    this.username = ''; this.password = '';
    this.fpError = ''; this.fpSuccess = '';
  }
}
