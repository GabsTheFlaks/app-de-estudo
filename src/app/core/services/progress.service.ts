import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private supabase = inject(SupabaseService);

  // In-memory cache: Set of completed lesson IDs for current user
  private _completedIds = signal<Set<string>>(new Set());
  completedIds = this._completedIds.asReadonly();

  async loadProgress(courseId: string): Promise<void> {
    const user = this.supabase.appUser();
    if (!user) return;

    const { data, error } = await this.supabase.client
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', user.id);

    if (error) { console.error('[ProgressService]', error); return; }

    this._completedIds.set(new Set((data ?? []).map((r: { lesson_id: string }) => r.lesson_id)));
  }

  isCompleted(lessonId: string): boolean {
    return this._completedIds().has(lessonId);
  }

  async markComplete(lessonId: string): Promise<void> {
    const user = this.supabase.appUser();
    if (!user) return;

    const { error } = await this.supabase.client
      .from('lesson_progress')
      .upsert({ user_id: user.id, lesson_id: lessonId }, { onConflict: 'user_id,lesson_id' });

    if (error) throw error;
    this._completedIds.update(s => new Set([...s, lessonId]));
  }

  async markIncomplete(lessonId: string): Promise<void> {
    const user = this.supabase.appUser();
    if (!user) return;

    const { error } = await this.supabase.client
      .from('lesson_progress')
      .delete()
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId);

    if (error) throw error;
    this._completedIds.update(s => {
      const next = new Set(s);
      next.delete(lessonId);
      return next;
    });
  }
}
