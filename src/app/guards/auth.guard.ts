import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, switchMap, take } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return auth.sessionChecked$.pipe(
    filter(checked => checked === true),
    take(1),
    switchMap(() => auth.isLoggedIn$),
    take(1),
    map(loggedIn => {
      if (loggedIn) return true;
      // Redirect to home page (Settings > Admin login) instead of standalone login page
      router.navigate(['/']);
      return false;
    })
  );
};
