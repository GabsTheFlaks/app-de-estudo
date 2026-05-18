import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Course, Lesson, Comment, LessonAttachment, AndonAlert } from '../models/interfaces';
import { RealtimeChannel } from '@supabase/supabase-js';

// Re-export for backward compatibility
export type { Course, Lesson, Comment, LessonAttachment, AndonAlert } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private supabase = inject(SupabaseService);

  private cachedCourses: Course[] | null = null;
  private cachedLessons = new Map<string, Lesson[]>();

  async getCourses(forceRefresh = false): Promise<Course[]> {
    if (this.cachedCourses && !forceRefresh) {
      return this.cachedCourses;
    }

    const { data, error } = await this.supabase.client
      .from('courses')
      .select('id, title, description, category, link_drive, file_type, thumbnail_url, announcement, instructor_id, users(firstname, lastname, avatar_url)');
      
    if (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
    
    this.cachedCourses = data as unknown as Course[];
    return this.cachedCourses;
  }

  async getCourse(id: string): Promise<Course | null> {
    if (this.cachedCourses) {
       const found = this.cachedCourses.find(c => c.id === id);
       if (found) return found;
    }

    const { data, error } = await this.supabase.client
      .from('courses')
      .select('id, title, description, category, link_drive, file_type, thumbnail_url, announcement, instructor_id, users(firstname, lastname, avatar_url)')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
    
    return data as unknown as Course;
  }

  async addCourse(course: Omit<Course, 'id'>): Promise<Course | null> {
    const { data: { user } } = await this.supabase.client.auth.getUser();

    const { data, error } = await this.supabase.client
      .from('courses')
      .insert([{ ...course, instructor_id: user?.id }])
      .select()
      .single();
      
    if (error) {
      console.error('Error inserting course:', error);
      throw error;
    }
    
    // Invalidate cache
    this.cachedCourses = null;
    return data as Course;
  }

  async getLessons(courseId: string, forceRefresh = false): Promise<Lesson[]> {
    if (this.cachedLessons.has(courseId) && !forceRefresh) {
      return this.cachedLessons.get(courseId)!;
    }

    const { data, error } = await this.supabase.client
      .from('lessons')
      .select('id, course_id, title, description, file_type, link_drive, "order", created_at')
      .eq('course_id', courseId)
      .order('order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist yet
        return [];
      }
      console.error('Error fetching lessons:', error);
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
      .select('id, course_id, title, description, file_type, link_drive, "order", created_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching lesson:', error);
      throw error;
    }

    return data;
  }

  async createLesson(lesson: Partial<Lesson>, attachments: { title: string, file_type: string, url: string }[] = []): Promise<Lesson> {
    const { data, error } = await this.supabase.client
      .from('lessons')
      .insert([lesson])
      .select()
      .single();

    if (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }

    if (attachments.length > 0) {
      const inserts = attachments.map(a => ({ ...a, lesson_id: data.id }));
      const { error: attError } = await this.supabase.client
        .from('lesson_attachments')
        .insert(inserts);
      
      if (attError) {
         console.error('Error creating lesson attachments:', attError);
         // Don't throw to prevent failing the lesson creation completely, but log it.
      }
    }



    // Invalidate lessons cache for this course
    if (lesson.course_id) {
       this.cachedLessons.delete(lesson.course_id);
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
    this.cachedCourses = null;
  }

  async updateCourseTitle(id: string, title: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('courses')
      .update({ title })
      .eq('id', id);
    if (error) throw error;
    this.cachedCourses = null;
  }

  async updateCourseLink(id: string, link_drive: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('courses')
      .update({ link_drive })
      .eq('id', id);
    if (error) throw error;
    this.cachedCourses = null;
  }

  async updateCourseAnnouncement(id: string, announcement: string | null): Promise<void> {
    const { error } = await this.supabase.client
      .from('courses')
      .update({ announcement })
      .eq('id', id);
    if (error) throw error;
    this.cachedCourses = null;
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
    this.cachedLessons.clear();
  }

  async updateLessonTitle(id: string, title: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('lessons')
      .update({ title })
      .eq('id', id);
    if (error) throw error;
    this.cachedLessons.clear();
  }

  async updateLessonOrders(updates: { id: string, order: number }[]): Promise<void> {
    // Perform parallel updates for performance
    const promises = updates.map(update => 
      this.supabase.client
        .from('lessons')
        .update({ 'order': update.order })
        .eq('id', update.id)
    );
    
    await Promise.all(promises);
    this.cachedLessons.clear(); // Clear cache to force reload on next access
  }


  // Comments
  async getComments(lessonId: string, limit = 10, offset = 0): Promise<{ data: Comment[], count: number | null }> {
    const { data, error, count } = await this.supabase.client
      .from('comments')
      .select('id, lesson_id, user_id, user_name, avatar_url, content, created_at', { count: 'exact' })
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error && error.code === '42P01') return { data: [], count: 0 }; // Table doesn't exist
    if (error) throw error;
    
    // Reverse data so oldest is first if we want ascending display, or just keep descending if we want newest first.
    // For comments, usually newest first is better if paginated like this, or we append to bottom.
    // Let's keep descending order from DB and return as is.
    return { data: data || [], count };
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

  // Lesson Ratings
  async getUserLessonRating(lessonId: string): Promise<number | null> {
    const { data, error } = await this.supabase.client
      .from('lesson_ratings')
      .select('rating')
      .eq('lesson_id', lessonId)
      .maybeSingle();
    
    if (error) {
      if (error.code === '42P01') return null; // Tabelas ainda não criadas
      throw error;
    }
    
    return data?.rating ?? null;
  }

  async saveLessonRating(lessonId: string, rating: number): Promise<void> {
    const { data: { user } } = await this.supabase.client.auth.getUser();
    if (!user) throw new Error("Não autenticado.");

    const { error } = await this.supabase.client
      .from('lesson_ratings')
      .upsert({
        user_id: user.id,
        lesson_id: lessonId,
        rating: rating
      }, { onConflict: 'user_id, lesson_id' });

    if (error) throw error;
  }

  // Andon Alert System (Controle de Qualidade)
  async createAndonAlert(courseId: string, lessonId: string, description: string): Promise<void> {
    const { data: { user } } = await this.supabase.client.auth.getUser();
    if (!user) throw new Error("Não autenticado.");

    const appUser = this.supabase.appUser();
    const name = appUser ? `${appUser.firstname} ${appUser.lastname}`.trim() : 'Estudante';

    const { error } = await this.supabase.client
      .from('andon_alerts')
      .insert({
        user_id: user.id,
        user_name: name,
        course_id: courseId,
        lesson_id: lessonId,
        description: description,
        status: 'pending'
      });
      
    if (error) throw error;
  }

  subscribeToAndonAlerts(callback: (alert: AndonAlert) => void): RealtimeChannel {
    console.log('Configurando canal de Realtime para andon_alerts...');

    const channel = this.supabase.client.channel('admin_andon_realtime');

    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'andon_alerts'
    }, async (payload) => {
      console.log('Evento INSERT detectado no andon_alerts:', payload);

      const newId = payload.new['id'];

      try {
        // Tenta buscar o alerta completo com os nomes de curso/aula
        const { data, error } = await this.supabase.client
          .from('andon_alerts')
          .select(`
            id, user_id, user_name, course_id, lesson_id, description, created_at, status,
            courses(title),
            lessons(title)
          `)
          .eq('id', newId)
          .single();

        if (data && !error) {
          console.log('Alerta completo recuperado com sucesso:', data);
          callback(data as unknown as AndonAlert);
        } else {
          console.warn('Não foi possível recuperar dados relacionados, enviando alerta puro:', error);
          callback(payload.new as AndonAlert);
        }
      } catch (e) {
        console.error('Erro ao processar payload de Andon:', e);
        callback(payload.new as AndonAlert);
      }
    });

    return channel;
  }

  async getPendingAndonAlerts(): Promise<AndonAlert[]> {
    const { data, error } = await this.supabase.client
      .from('andon_alerts')
      .select(`
        id,
        user_id,
        user_name,
        course_id,
        lesson_id,
        description,
        created_at,
        status,
        courses(title),
        lessons(title)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
      
    if (error) {
      if (error.code === '42P01') return [];
      throw error;
    }
    return (data as unknown as AndonAlert[]) || [];
  }

  async resolveAndonAlert(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('andon_alerts')
      .update({ status: 'resolved' })
      .eq('id', id);
      
    if (error) throw error;
  }

  // Lesson Attachments (Materiais Extras)
  async getLessonAttachments(lessonId: string): Promise<LessonAttachment[]> {
    const { data, error } = await this.supabase.client
      .from('lesson_attachments')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true });
      
    if (error) {
      if (error.code === '42P01') return []; // Tabela não existe ainda
      console.error("Erro ao buscar anexos:", error);
      return [];
    }
    return data || [];
  }
}
