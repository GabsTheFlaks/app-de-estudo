import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router } from '@angular/router';
import { CourseService } from '../../core/services/course.service';
import { EmbedUrlService } from '../../shared/utils/embed-url.service';
import { Lesson } from '../../core/models/interfaces';

@Component({
  selector: 'app-saved-lessons',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  template: `
    <div class="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Salvos</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Acesse suas aulas favoritas rapidamente</p>
        </div>
      </div>

      @if (isLoading()) {
        <div class="animate-pulse flex space-x-4">
          <div class="flex-1 space-y-4 py-1">
            <div class="h-40 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            <div class="h-40 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          </div>
        </div>
      } @else if (savedLessons().length === 0) {
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center flex flex-col items-center">
          <div class="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
            <mat-icon class="text-slate-400 text-3xl">bookmark_border</mat-icon>
          </div>
          <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">Nenhuma aula salva</h3>
          <p class="text-slate-500 dark:text-slate-400 text-sm max-w-sm mb-6">Você ainda não salvou nenhuma aula. Quando salvar, elas aparecerão aqui.</p>
          <a routerLink="/dashboard" class="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Explorar Turmas
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          @for (lesson of savedLessons(); track lesson.id) {
            <div class="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <div class="p-5 flex flex-col h-full bg-slate-50/50 dark:bg-slate-800/50 group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-900/10 transition-colors">
                <div class="flex justify-between items-start mb-4">
                  <div class="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
                    <mat-icon>{{ getIconType(lesson.file_type) }}</mat-icon>
                  </div>
                  <button (click)="unsaveLesson(lesson.id!)" class="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Remover dos salvos">
                    <mat-icon>bookmark</mat-icon>
                  </button>
                </div>
                
                <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{{ lesson.title }}</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
                  {{ lesson.description || 'Nenhuma descrição fornecida.' }}
                </p>
                
                <button (click)="goToLesson(lesson.course_id, lesson.id!)" class="w-full mt-auto flex items-center justify-center gap-2 py-2.5 px-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                  Acessar Aula
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

  savedLessons = signal<Lesson[]>([]);
  isLoading = signal<boolean>(true);

  async ngOnInit() {
    await this.loadSavedLessons();
  }

  async loadSavedLessons() {
    this.isLoading.set(true);
    try {
      const savedIds: string[] = JSON.parse(localStorage.getItem('saved_lessons') || '[]');
      
      // Load all lessons that are saved
      // Using Promise.all to fetch them individually (could be optimized with a query, but works well enough)
      const lessonsPromises = savedIds.map(id => this.courseService.getLesson(id));
      const lessonsFiles = await Promise.all(lessonsPromises);
      
      const valids = lessonsFiles.filter((l): l is Lesson => l !== null);
      this.savedLessons.set(valids);
    } catch(e) {
      console.warn("Failed to load saved lessons", e);
    } finally {
      this.isLoading.set(false);
    }
  }

  unsaveLesson(id: string) {
    let savedList: string[] = JSON.parse(localStorage.getItem('saved_lessons') || '[]');
    savedList = savedList.filter(item => item !== id);
    localStorage.setItem('saved_lessons', JSON.stringify(savedList));
    
    // Update local state
    this.savedLessons.update(list => list.filter(l => l.id !== id));
  }

  goToLesson(courseId: string, lessonId: string) {
    this.router.navigate(['/lesson', lessonId, 'viewer']);
  }

  getIconType(type: string | undefined): string {
    return this.embedService.getIconForFileType(type);
  }
}
