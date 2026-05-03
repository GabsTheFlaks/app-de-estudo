import { Injectable, signal, inject, ErrorHandler } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { env } from '../env';

import { Role } from './enums';

export interface AppUser {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: Role;
  avatar_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public client: SupabaseClient;

  // State
  private _user = signal<User | null>(null);
  private _appUser = signal<AppUser | null>(null);
  private _loading = signal<boolean>(true);

  // Expose state as read-only signals
  public readonly currentUser = this._user.asReadonly();
  public readonly appUser = this._appUser.asReadonly();
  public readonly isLoading = this._loading.asReadonly();

  private errorHandler = inject(ErrorHandler);

  constructor() {
    const url = env.SUPABASE_URL || 'https://placeholder.supabase.co';
    const key = env.SUPABASE_ANON_KEY || 'missing-key';

    this.client = createClient(url, key);
    this.init();
  }

  private async init() {
    try {
      const { data: { session } } = await this.client.auth.getSession();
      if (session?.user) {
        this._user.set(session.user);
        await this.fetchUserRole(session.user.id);
      }
    } catch (error) {
      this.errorHandler.handleError(error);
    }

    this._loading.set(false);

    try {
      this.client.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          this._user.set(session.user);
          await this.fetchUserRole(session.user.id);
        } else {
          this._user.set(null);
          this._appUser.set(null);
        }
        this._loading.set(false);
      });
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }

  private async fetchUserRole(userId: string) {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data && !error) {
        this._appUser.set(data as AppUser);
      } else {
        this.errorHandler.handleError(error);
      }
    } catch (e) {
      this.errorHandler.handleError(e);
    }
  }

  async updateProfile(updates: Partial<AppUser>) {
    const userId = this._appUser()?.id;
    if (!userId) throw new Error("No user logged in");

    // Prevent role escalation from the frontend
    const safeUpdates = { ...updates };
    delete safeUpdates.role;

    const { error } = await this.client
      .from('users')
      .update(safeUpdates)
      .eq('id', userId);

    if (error) throw error;

    // Refresh user state
    await this.fetchUserRole(userId);
  }
}
