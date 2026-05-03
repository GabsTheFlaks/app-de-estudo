import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';

export const authGuard = () => {
  const router = inject(Router);
  const supabase = inject(SupabaseService);

  return toObservable(supabase.isLoading).pipe(
    filter((loading) => !loading),
    map(() => {
      const isAuth = !!supabase.currentUser();
      if (isAuth) {
        return true;
      }
      return router.createUrlTree(['/login']);
    })
  );
};
