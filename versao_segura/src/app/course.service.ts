import { Injectable, inject, ErrorHandler } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Course {
  id: string; // Used UUID for type safety
  title: string;
  description: string;
  category: string;
  link_drive: string;
  file_type: string;
  thumbnail_url: string;
}

export interface Lesson {
  id?: string;
  course_id: string;
  title: string;
  description?: string;
  file_type: string;
  link_drive: string;
  created_at?: string;
}

export interface Comment {
  id?: string;
  lesson_id: string;
  user_id: string;
  user_name: string;
  avatar_url?: string;
  content: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private supabase = inject(SupabaseService);
  private errorHandler = inject(ErrorHandler);

  private cachedCourses: Course[] | null = null;
  private cachedLessons = new Map<string, Lesson[]>();

  async getCourses(forceRefresh = false): Promise<Course[]> {
    if (this.cachedCourses && !forceRefresh) {
      return this.cachedCourses;
    }

    const { data, error } = await this.supabase.client
      .from('courses')
      .select('*');

    if (error) {
      this.errorHandler.handleError(error);
      throw error;
    }

    this.cachedCourses = data as Course[];
    return this.cachedCourses;
  }

  async getCourse(id: string): Promise<Course | null> {
    if (this.cachedCourses) {
       const found = this.cachedCourses.find(c => c.id === id);
       if (found) return found;
    }

    const { data, error } = await this.supabase.client
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      this.errorHandler.handleError(error);
      throw error;
    }

    return data as Course;
  }

  async addCourse(course: Omit<Course, 'id'>): Promise<Course | null> {
    const { data, error } = await this.supabase.client
      .from('courses')
      .insert([course])
      .select()
      .single();

    if (error) {
      this.errorHandler.handleError(error);
      throw error;
    }

    if (this.cachedCourses) {
      this.cachedCourses = [...this.cachedCourses, data as Course];
    }
    return data as Course;
  }

  async getLessons(courseId: string, forceRefresh = false): Promise<Lesson[]> {
    if (this.cachedLessons.has(courseId) && !forceRefresh) {
      return this.cachedLessons.get(courseId)!;
    }

    const { data, error } = await this.supabase.client
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist yet
        return [];
      }
      this.errorHandler.handleError(error);
      throw error;
    }

    this.cachedLessons.set(courseId, data || []);
    return data || [];
  }

  async getLesson(id: string): Promise<Lesson | null> {
    // Try to find in cache
    for (const lessons of this.cachedLessons.values()) {
      const found = lessons.find(l => l.id === id);
      if (found) return found;
    }

    const { data, error } = await this.supabase.client
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      this.errorHandler.handleError(error);
      throw error;
    }

    return data;
  }

  async createLesson(lesson: Partial<Lesson>): Promise<Lesson> {
    const { data, error } = await this.supabase.client
      .from('lessons')
      .insert([lesson])
      .select()
      .single();

    if (error) {
      this.errorHandler.handleError(error);
      throw error;
    }

    if (lesson.course_id && this.cachedLessons.has(lesson.course_id)) {
       const lessons = this.cachedLessons.get(lesson.course_id)!;
       this.cachedLessons.set(lesson.course_id, [data, ...lessons]);
    }
    return data;
  }

  async deleteCourse(id: string): Promise<void> {
    // Delete associated lessons first to avoid foreign key constraints
    const { error: lessonError } = await this.supabase.client
      .from('lessons')
      .delete()
      .eq('course_id', id);
    if (lessonError) console.warn("Failed to delete lessons:", lessonError);

    const { data, error } = await this.supabase.client
      .from('courses')
      .delete()
      .eq('id', id)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error("Permissão negada ou turma não encontrada no banco (RLS).");
    }
    if (this.cachedCourses) {
      this.cachedCourses = this.cachedCourses.filter(c => c.id !== id);
    }
    this.cachedLessons.delete(id);
  }

  async updateCourseTitle(id: string, title: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('courses')
      .update({ title })
      .eq('id', id);
    if (error) throw error;
    if (this.cachedCourses) {
      this.cachedCourses = this.cachedCourses.map(c => c.id === id ? { ...c, title } : c);
    }
  }

  async updateCourseLink(id: string, link_drive: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('courses')
      .update({ link_drive })
      .eq('id', id);
    if (error) throw error;
    if (this.cachedCourses) {
      this.cachedCourses = this.cachedCourses.map(c => c.id === id ? { ...c, link_drive } : c);
    }
  }

  async deleteLesson(id: string): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('lessons')
      .delete()
      .eq('id', id)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error("Permissão negada ou material não encontrado no banco (RLS).");
    }

    // Find the lesson in cache and remove it
    for (const [courseId, lessons] of this.cachedLessons.entries()) {
      const index = lessons.findIndex(l => l.id === id);
      if (index !== -1) {
        const newLessons = [...lessons];
        newLessons.splice(index, 1);
        this.cachedLessons.set(courseId, newLessons);
        break;
      }
    }
  }

  async updateLessonTitle(id: string, title: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('lessons')
      .update({ title })
      .eq('id', id);
    if (error) throw error;

    // Update the lesson in cache
    for (const [courseId, lessons] of this.cachedLessons.entries()) {
      const index = lessons.findIndex(l => l.id === id);
      if (index !== -1) {
        const newLessons = [...lessons];
        newLessons[index] = { ...newLessons[index], title };
        this.cachedLessons.set(courseId, newLessons);
        break;
      }
    }
  }


  // Comments
  async getComments(lessonId: string): Promise<Comment[]> {
    const { data, error } = await this.supabase.client
      .from('comments')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true });

    if (error && error.code === '42P01') return []; // Table doesn't exist
    if (error) throw error;
    return data || [];
  }

  async addComment(comment: Partial<Comment>): Promise<Comment> {
    const { data, error } = await this.supabase.client
      .from('comments')
      .insert([comment])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateComment(id: string, content: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('comments')
      .update({ content })
      .eq('id', id);
    if (error) throw error;
  }

  async deleteComment(id: string): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('comments')
      .delete()
      .eq('id', id)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error("Permissão negada ou comentário não encontrado.");
    }
  }
}
