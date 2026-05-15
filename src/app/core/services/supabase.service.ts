import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { env } from '../../../env';
import { AppUser } from '../models/interfaces';

// Re-export for backward compatibility
export type { AppUser } from '../models/interfaces';

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
      console.warn('Supabase session fetch failed:', error);
    }
    
    this._loading.set(false);

    try {
      this.client.auth.onAuthStateChange(async (_event, session) => {
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
      console.warn('Supabase auth listener failed:', error);
    }
  }

  private async fetchUserRole(userId: string) {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('id, email, firstname, lastname, role, avatar_url')
        .eq('id', userId)
        .maybeSingle();
        
      if (data && !error) {
        this._appUser.set(data as AppUser);
      } else {
        console.error('Failed to fetch user role:', error);
      }
    } catch (e) {
      console.error('Exception fetching user role', e);
    }
  }

  async updateProfile(updates: Partial<AppUser>) {
    const userId = this._appUser()?.id;
    if (!userId) throw new Error("No user logged in");
    
    const { error } = await this.client
      .from('users')
      .update(updates)
      .eq('id', userId);
      
    if (error) throw error;
    
    // Refresh user state
    await this.fetchUserRole(userId);
  }
}
