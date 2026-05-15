import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { AppUser } from '../models/interfaces';
import { signal } from '@angular/core';
import { adminGuard } from './admin.guard';

// Mock signals
const mockUser = signal<object | null>(null);
const mockLoading = signal<boolean>(false);
const mockAppUser = signal<AppUser | null>(null);

const supabaseMock = {
  isLoading: mockLoading.asReadonly(),
  currentUser: mockUser.asReadonly(),
  appUser: mockAppUser.asReadonly(),
};

const routerMock = {
  createUrlTree: (commands: string[]) => ({ commands }) as unknown as UrlTree,
};

describe('adminGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: supabaseMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  it('should allow access when user is admin', (done) => {
    mockLoading.set(false);
    mockUser.set({ id: 'admin-1' });
    mockAppUser.set({ id: 'admin-1', email: 'a@a.com', firstname: 'Admin', lastname: 'User', role: 'admin', avatar_url: null });

    TestBed.runInInjectionContext(() => {
      const result = adminGuard();
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

  it('should redirect to /dashboard for non-admin authenticated users', (done) => {
    mockLoading.set(false);
    mockUser.set({ id: 'student-1' });
    mockAppUser.set({ id: 'student-1', email: 's@s.com', firstname: 'Student', lastname: 'User', role: 'student', avatar_url: null });

    TestBed.runInInjectionContext(() => {
      const result = adminGuard();
      if (result && typeof result === 'object' && 'subscribe' in result) {
        (result as ReturnType<typeof import('rxjs').of>).subscribe((val: unknown) => {
          expect(val).toMatchObject({ commands: ['/dashboard'] });
          done();
        });
      } else {
        done();
      }
    });
  });

  it('should redirect to /login when user is not authenticated', (done) => {
    mockLoading.set(false);
    mockUser.set(null);
    mockAppUser.set(null);

    TestBed.runInInjectionContext(() => {
      const result = adminGuard();
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
