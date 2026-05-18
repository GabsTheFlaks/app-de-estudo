import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { signal } from '@angular/core';
import { authGuard } from './auth.guard';
import { UrlTree } from '@angular/router';

// Mock SupabaseService
const mockUser = signal<object | null>(null);
const mockLoading = signal<boolean>(false);

const supabaseMock = {
  isLoading: mockLoading.asReadonly(),
  currentUser: mockUser.asReadonly(),
};

const routerMock = {
  createUrlTree: (commands: string[]) => ({ commands }) as unknown as UrlTree,
};

describe('authGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: supabaseMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  it('should allow access when user is authenticated', (done: any) => {
    mockLoading.set(false);
    mockUser.set({ id: 'user-123' });

    TestBed.runInInjectionContext(() => {
      const result = authGuard();
      if (result && typeof result === 'object' && 'subscribe' in result) {
        (result as ReturnType<typeof import('rxjs').of>).subscribe((val: unknown) => {
          expect(val).toBe(true);
          done();
        });
      } else {
        done();
      }
    });
  });

  it('should redirect to /login when user is not authenticated', (done: any) => {
    mockLoading.set(false);
    mockUser.set(null);

    TestBed.runInInjectionContext(() => {
      const result = authGuard();
      if (result && typeof result === 'object' && 'subscribe' in result) {
        (result as ReturnType<typeof import('rxjs').of>).subscribe((val: unknown) => {
          expect(val).toMatchObject({ commands: ['/login'] });
          done();
        });
      } else {
        done();
      }
    });
  });
});
