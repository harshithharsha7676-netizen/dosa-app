import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, CheckResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl;

  isLoggedIn$ = new BehaviorSubject<boolean>(false);
  username$   = new BehaviorSubject<string>('');

  // Track whether the initial session check has completed
  sessionChecked$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    this.checkSession();
  }

  checkSession(): void {
    this.http
      .get<CheckResponse>(`${this.api}/auth/check`, { withCredentials: true })
      .subscribe({
        next: res => {
          this.isLoggedIn$.next(res.loggedIn);
          this.username$.next(res.username ?? '');
          this.sessionChecked$.next(true);
        },
        error: () => {
          this.isLoggedIn$.next(false);
          this.username$.next('');
          this.sessionChecked$.next(true);
        }
      });
  }

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.api}/auth/login`, req, { withCredentials: true })
      .pipe(
        tap(res => {
          if (res.success) {
            this.isLoggedIn$.next(true);
            this.username$.next(res.username);
            this.sessionChecked$.next(true);
          }
        })
      );
  }

  logout(): Observable<unknown> {
    return this.http
      .post(`${this.api}/auth/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.isLoggedIn$.next(false);
          this.username$.next('');
        })
      );
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn$.value;
  }

  getUsername(): string {
    return this.username$.value;
  }
}
