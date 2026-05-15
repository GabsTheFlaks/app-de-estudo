import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface LearningPath {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  courses?: PathCourse[];
}

export interface PathCourse {
  id: string;
  path_id: string;
  course_id: string;
  position: number;
}

@Injectable({ providedIn: 'root' })
export class LearningPathService {
  private supabase = inject(SupabaseService);

  async getPaths(): Promise<LearningPath[]> {
    const { data, error } = await this.supabase.client
      .from('learning_paths')
      .select('id, title, description, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async getPathWithCourses(pathId: string): Promise<LearningPath | null> {
    const { data, error } = await this.supabase.client
      .from('learning_paths')
      .select('id, title, description, created_at, path_courses(id, path_id, course_id, position)')
      .eq('id', pathId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async createPath(title: string, description: string): Promise<LearningPath> {
    const user = this.supabase.appUser();
    const { data, error } = await this.supabase.client
      .from('learning_paths')
      .insert({ title, description, created_by: user?.id })
      .select('id, title, description, created_at')
      .single();

    if (error) throw error;
    return data;
  }

  async updatePath(id: string, title: string, description: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('learning_paths')
      .update({ title, description })
      .eq('id', id);

    if (error) throw error;
  }

  async deletePath(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('learning_paths')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async addCourseToPath(pathId: string, courseId: string, position: number): Promise<void> {
    const { error } = await this.supabase.client
      .from('path_courses')
      .upsert({ path_id: pathId, course_id: courseId, position }, { onConflict: 'path_id,course_id' });

    if (error) throw error;
  }

  async removeCourseFromPath(pathId: string, courseId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('path_courses')
      .delete()
      .eq('path_id', pathId)
      .eq('course_id', courseId);

    if (error) throw error;
  }

  async reorderCourses(pathId: string, courseIds: string[]): Promise<void> {
    const updates = courseIds.map((courseId, index) => ({
      path_id: pathId,
      course_id: courseId,
      position: index,
    }));

    const { error } = await this.supabase.client
      .from('path_courses')
      .upsert(updates, { onConflict: 'path_id,course_id' });

    if (error) throw error;
  }
}
