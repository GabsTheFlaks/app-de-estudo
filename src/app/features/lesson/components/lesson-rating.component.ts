import { Component, input, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CourseService } from '../../../core/services/course.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-lesson-rating',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800/50 shadow-sm">
      <div>
        <h4 class="text-sm font-semibold text-slate-800 dark:text-slate-200">O que achou desta aula?</h4>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sua opinião nos ajuda a melhorar.</p>
      </div>
      <div class="flex items-center gap-1">
        @for (star of [1, 2, 3, 4, 5]; track star) {
          <button
            type="button"
            (click)="submitRating(star)"
            (mouseenter)="hoverRating.set(star)"
            (mouseleave)="hoverRating.set(0)"
            class="p-1 transition-transform active:scale-90 hover:scale-110 border-none bg-transparent cursor-pointer flex items-center justify-center"
            [ngClass]="(hoverRating() || currentRating() || 0) >= star ? 'text-amber-400 dark:text-amber-300' : 'text-slate-300 dark:text-slate-600'"
          >
            <mat-icon class="text-[26px] w-[26px] h-[26px] flex items-center justify-center">
              {{ (hoverRating() || currentRating() || 0) >= star ? 'star' : 'star_border' }}
            </mat-icon>
          </button>
        }
        @if (currentRating()) {
          <span class="text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full ml-2 animate-pulse">Avaliado!</span>
        }
      </div>
    </div>
  `
})
export class LessonRatingComponent {
  lessonId = input.required<string>();
  initialRating = input<number | null>(null);

  private courseService = inject(CourseService);
  private toast = inject(ToastService);

  hoverRating = signal<number>(0);
  private _currentRating = signal<number | null>(null);

  currentRating = computed(() => this._currentRating() ?? this.initialRating());

  async submitRating(rating: number) {
    if (!this.lessonId()) return;
    try {
      await this.courseService.saveLessonRating(this.lessonId(), rating);
      this._currentRating.set(rating);
      this.toast.success('Avaliação salva! Obrigado.');
    } catch (e) {
      console.error(e);
      this.toast.error('Erro ao salvar avaliação.');
    }
  }
}
