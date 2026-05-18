import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router } from '@angular/router';
import { CourseService } from '../../core/services/course.service';
import { EmbedUrlService } from '../../shared/utils/embed-url.service';
import { Lesson } from '../../core/models/interfaces';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-saved-lessons',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full animate-fade-in">
      
      <!-- Welcome Header -->
      <div class="mb-8">
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <mat-icon class="text-indigo-600 dark:text-indigo-400 text-3xl">bookmark</mat-icon>
          Meus Favoritos
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
          Acesse rapidamente os materiais e videoaulas que você salvou para revisar depois.
        </p>
      </div>

      <!-- Main Content Grid -->
      @if (isLoading()) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div class="h-44 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
          <div class="h-44 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
          <div class="h-44 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
        </div>
      } @else if (lessons().length === 0) {
        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-16 text-center flex flex-col items-center shadow-sm max-w-xl mx-auto animate-fade-in">
          <div class="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <mat-icon class="text-3xl">bookmark_border</mat-icon>
          </div>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Nenhum favorito salvo</h3>
          <p class="text-slate-500 dark:text-slate-400 text-xs max-w-xs leading-relaxed mb-6 font-semibold">
            Você ainda não favoritou nenhuma aula. Explore os treinamentos no painel e salve materiais importantes para vê-los aqui!
          </p>
          <a routerLink="/dashboard" class="inline-flex justify-center items-center px-5 py-3 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer">
            Explorar Painel de Estudos
          </a>
        </div>
      } @else {
        <!-- Lessons Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          @for (lesson of lessons(); track lesson.id) {
            <div class="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <div class="p-5 flex flex-col h-full bg-slate-50/50 dark:bg-slate-800/50 group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-900/10 transition-colors">

                <div class="flex justify-between items-start mb-4">
                  <div class="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
                    <mat-icon class="text-[20px]">{{ getIconType(lesson.file_type) }}</mat-icon>
                  </div>

                  <button
                    (click)="removeFavorite(lesson.id!)"
                    class="text-red-500 hover:text-red-700 transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
                    title="Remover dos favoritos"
                  >
                    <mat-icon class="text-[18px] w-[18px] h-[18px]">bookmark</mat-icon>
                  </button>
                </div>
                
                <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{{ lesson.title }}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-5 flex-grow font-semibold">
                  {{ lesson.description || 'Nenhuma explicação adicional.' }}
                </p>
                
                <button
                  (click)="goToLesson(lesson.id!)"
                  class="w-full mt-auto flex items-center justify-center gap-2 py-2.5 px-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-250 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all cursor-pointer shadow-sm"
                >
                  Estudar Conteúdo
                </button>
              </div>
            </div>
          }
        </div>
      }

    </div>
  `,
})
export class SavedLessonsPage implements OnInit {
  private courseService = inject(CourseService);
  private router = inject(Router);
  private embedService = inject(EmbedUrlService);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  lessons = signal<Lesson[]>([]);
  isLoading = signal<boolean>(true);

  async ngOnInit() {
    await this.loadSavedLessons();
  }

  async loadSavedLessons() {
    this.isLoading.set(true);
    if (!isPlatformBrowser(this.platformId)) {
      this.isLoading.set(false);
      return;
    }
    const raw = localStorage.getItem('saved_lessons');
    if (!raw) {
      this.lessons.set([]);
      this.isLoading.set(false);
      return;
    }
    try {
      const savedIds: string[] = JSON.parse(raw);
      if (!Array.isArray(savedIds) || savedIds.length === 0) {
        this.lessons.set([]);
        this.isLoading.set(false);
        return;
      }

      // Fetch details in parallel
      const promises = savedIds.map(id => this.courseService.getLesson(id).catch(() => null));
      const results = await Promise.all(promises);
      const validLessons = results.filter((l): l is Lesson => l !== null);

      this.lessons.set(validLessons);
    } catch (e) {
      console.warn('Erro ao carregar favoritos:', e);
      this.lessons.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  removeFavorite(lessonId: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    const raw = localStorage.getItem('saved_lessons');
    if (!raw) return;
    try {
      let savedIds: string[] = JSON.parse(raw);
      savedIds = savedIds.filter(id => id !== lessonId);
      localStorage.setItem('saved_lessons', JSON.stringify(savedIds));
      this.lessons.update(current => current.filter(l => l.id !== lessonId));
      this.toast.info('Material removido dos favoritos.');
    } catch (e) {
      console.error(e);
    }
  }

  goToLesson(lessonId: string) {
    this.router.navigate(['/lesson', lessonId, 'viewer']);
  }

  getIconType(type: string | undefined): string {
    return this.embedService.getIconForFileType(type);
  }
}
