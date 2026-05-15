import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';

export interface SearchResult {
  type: 'course' | 'lesson';
  id: string;
  title: string;
  subtitle?: string;
  route: string[];
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private supabase = inject(SupabaseService);

  async search(query: string): Promise<SearchResult[]> {
    if (!query.trim() || query.trim().length < 2) return [];

    const q = `%${query.trim()}%`;

    const [coursesRes, lessonsRes] = await Promise.all([
      this.supabase.client
        .from('courses')
        .select('id, title, category')
        .ilike('title', q)
        .limit(5),
      this.supabase.client
        .from('lessons')
        .select('id, title, description, course_id')
        .ilike('title', q)
        .limit(5),
    ]);

    const courses: SearchResult[] = (coursesRes.data ?? []).map((c: {id: string; title: string; category: string}) => ({
      type: 'course' as const,
      id: c.id,
      title: c.title,
      subtitle: c.category,
      route: ['/course', c.id],
    }));

    const lessons: SearchResult[] = (lessonsRes.data ?? []).map((l: {id: string; title: string; description: string; course_id: string}) => ({
      type: 'lesson' as const,
      id: l.id,
      title: l.title,
      subtitle: l.description,
      route: ['/lesson', l.id, 'viewer'],
    }));

    return [...courses, ...lessons];
  }
}
