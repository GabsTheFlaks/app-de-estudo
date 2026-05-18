import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { CourseService } from './course.service';
import { SupabaseService } from './supabase.service';

describe('CourseService', () => {
  let service: CourseService;
  let supabaseSpy: any;
  let mockQuery: any;

  beforeEach(() => {
    // Fully chainable Supabase mock
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: function(resolve: any) { resolve({ data: [], error: null }); return this; }
    };

    const mockClient = {
      from: vi.fn().mockReturnValue(mockQuery)
    };

    supabaseSpy = { client: mockClient };

    const injector = Injector.create({
      providers: [
        { provide: SupabaseService, useValue: supabaseSpy }
      ]
    });

    runInInjectionContext(injector, () => {
      service = new CourseService();
    });
  });

  afterEach(() => {
    // Limpar o cache privado manipulando a instância para evitar vazamento entre testes
    (service as any).cachedCourses = null;
    (service as any).cachedLessons = new Map();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Busca de dados e Cache', () => {
    it('should fetch courses successfully', async () => {
      const mockData = [{ id: '1', title: 'Course 1' }];
      mockQuery.then = (resolve: any) => resolve({ data: mockData, error: null });

      const result = await service.getCourses();

      expect(supabaseSpy.client.from).toHaveBeenCalledWith('courses');
      expect(result).toEqual(mockData);
    });

    it('should return cached courses on second call (sem nova query ao Supabase)', async () => {
      const mockData = [{ id: '1', title: 'Course 1' }];
      mockQuery.then = (resolve: any) => resolve({ data: mockData, error: null });

      await service.getCourses();
      (supabaseSpy.client.from as Mock).mockClear();

      const result2 = await service.getCourses();

      expect(supabaseSpy.client.from).not.toHaveBeenCalled();
      expect(result2).toEqual(mockData);
    });

    it('should force refresh when forceRefresh=true', async () => {
      const mockData = [{ id: '1', title: 'Course 1' }];
      mockQuery.then = (resolve: any) => resolve({ data: mockData, error: null });

      await service.getCourses();
      (supabaseSpy.client.from as Mock).mockClear();

      await service.getCourses(true);

      expect(supabaseSpy.client.from).toHaveBeenCalled();
    });

    it('should throw error when fetching courses fails', async () => {
      mockQuery.then = (resolve: any, reject: any) => resolve({ data: null, error: new Error('DB Error') });

      await expect(service.getCourses()).rejects.toThrowError('DB Error');
    });
  });

  describe('Invalidação de cache', () => {
    it('should invalidate cachedCourses after addCourse()', async () => {
      (service as any).cachedCourses = [{ id: '1' }];

      const authMock = { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user1' } } }) };
      supabaseSpy.client.auth = authMock;
      mockQuery.then = (resolve: any) => resolve({ data: { id: '2' }, error: null });

      await service.addCourse({ title: 'New Course' } as any);

      expect((service as any).cachedCourses).toBeNull();
    });

    it('should invalidate cachedCourses after deleteCourse()', async () => {
      (service as any).cachedCourses = [{ id: '1' }];

      mockQuery.then = (resolve: any) => resolve({ data: [{id: '1'}], error: null }); // Mock delete return
      await service.deleteCourse('1');

      expect((service as any).cachedCourses).toBeNull();
    });

    it('should invalidate cachedLessons for course after deleteLesson()', async () => {
      (service as any).cachedLessons.set('course1', [{ id: 'lesson1' }]);

      mockQuery.then = (resolve: any) => resolve({ data: [{id: 'lesson1'}], error: null }); // Mock delete return
      await service.deleteLesson('lesson1');

      expect((service as any).cachedLessons.get('course1')).toBeUndefined();
    });

    it('should clear all cachedLessons after updateLessonOrders()', async () => {
      (service as any).cachedLessons.set('course1', [{ id: 'lesson1' }]);

      mockQuery.then = (resolve: any) => resolve({ error: null }); // Mock update return
      await service.updateLessonOrders([]);

      expect((service as any).cachedLessons.size).toBe(0);
    });
  });

  describe('Aulas e anexos', () => {
    it('should fetch lesson attachments successfully', async () => {
      const mockAttachments = [{ id: 'a1', file_type: 'pdf', title: 'Apostila' }];
      mockQuery.then = (resolve: any) => resolve({ data: mockAttachments, error: null });

      const result = await service.getLessonAttachments('lesson1');

      expect(supabaseSpy.client.from).toHaveBeenCalledWith('lesson_attachments');
      expect(result).toEqual(mockAttachments);
    });

    it('should return empty array when table does not exist (código 42P01)', async () => {
      const dbError = { code: '42P01', message: 'relation does not exist' };
      mockQuery.then = (resolve: any) => resolve({ data: null, error: dbError });

      const result = await service.getLessonAttachments('lesson1');

      expect(result).toEqual([]);
    });
  });

  describe('Comportamento em Erros', () => {
    it('should not mutate cache when an operation fails', async () => {
      (service as any).cachedCourses = [{ id: '1' }];

      mockQuery.then = (resolve: any) => resolve({ data: null, error: new Error('Delete failed') });

      try {
        await service.deleteCourse('1');
      } catch (e) {
      }

      expect((service as any).cachedCourses).not.toBeNull();
      expect((service as any).cachedCourses.length).toBe(1);
    });
  });
});
