import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  status: 'active' | 'cancelled';
}

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private supabase = inject(SupabaseService);

  /** Check if current user is enrolled in a course */
  async isEnrolled(courseId: string): Promise<boolean> {
    const user = this.supabase.appUser();
    if (!user) return false;

    const { data } = await this.supabase.client
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .maybeSingle();

    return !!data;
  }

  /** Get all course IDs the current user is enrolled in */
  async getEnrolledCourseIds(): Promise<string[]> {
    const user = this.supabase.appUser();
    if (!user) return [];

    const { data, error } = await this.supabase.client
      .from('enrollments')
      .select('course_id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (error) { console.error('[EnrollmentService]', error); return []; }
    return (data ?? []).map((e: { course_id: string }) => e.course_id);
  }

  /** Self-enroll current user in a course */
  async enroll(courseId: string): Promise<void> {
    const user = this.supabase.appUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await this.supabase.client
      .from('enrollments')
      .upsert(
        { user_id: user.id, course_id: courseId, status: 'active' },
        { onConflict: 'user_id,course_id' }
      );

    if (error) throw error;
  }

  /** Cancel enrollment */
  async unenroll(courseId: string): Promise<void> {
    const user = this.supabase.appUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await this.supabase.client
      .from('enrollments')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id)
      .eq('course_id', courseId);

    if (error) throw error;
  }

  /** Admin: get all enrollments for a course */
  async getCourseEnrollments(courseId: string): Promise<Enrollment[]> {
    const { data, error } = await this.supabase.client
      .from('enrollments')
      .select('id, user_id, course_id, enrolled_at, status')
      .eq('course_id', courseId)
      .eq('status', 'active')
      .order('enrolled_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }
}
