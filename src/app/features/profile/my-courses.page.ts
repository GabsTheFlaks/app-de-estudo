import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { CourseService } from '../../core/services/course.service';
import { Course } from '../../core/models/interfaces';

@Component({
  selector: 'app-my-courses-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="flex flex-col items-center">
      <main class="w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 relative z-10 w-full">
        <div class="mb-10">
          <h2 class="text-3xl font-normal text-slate-800 tracking-tight">Minhas Inscrições</h2>
          <p class="text-sm text-slate-500 mt-1">Turmas em que você está inscrito.</p>
        </div>

       @if (isLoading()) {
        <div class="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center h-[50vh]">
          <mat-icon class="animate-spin text-4xl mb-4 text-indigo-600">loop</mat-icon>
          <span>Carregando suas inscrições...</span>
        </div>
      } @else if (myCourses().length === 0) {
        <div class="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed max-w-2xl mx-auto mt-10">
          <mat-icon class="text-5xl text-slate-300 mb-4">school</mat-icon>
          <h3 class="text-lg font-medium text-slate-800 mb-2">Você ainda não está inscrito em nenhuma turma</h3>
          <p class="text-slate-500 text-sm mb-6 max-w-md mx-auto">Explore as turmas disponíveis e inscreva-se para acompanhar seu progresso e ter acesso rápido aos materiais.</p>
          <a routerLink="/dashboard" class="inline-flex items-center justify-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-sm">
            Explorar Turmas
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          @for (course of myCourses(); track course.id) {
            <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col group hover:shadow-md transition-shadow h-[300px] relative group cursor-pointer" [routerLink]="['/course', course.id]">
              <div class="h-32 bg-indigo-600 relative p-4 flex flex-col justify-between">
                @if (course.thumbnail_url) {
                  <div class="absolute inset-0 opacity-40 mix-blend-overlay">
                    <img [src]="course.thumbnail_url" alt="" class="w-full h-full object-cover block" />
                  </div>
                }
                <div class="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <div class="relative z-10 flex justify-between items-start">
                  <span class="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-medium text-white border border-white/30 shadow-sm">{{ course.category || 'Sem Categoria' }}</span>
                </div>
                <h3 class="text-white font-medium text-[20px] leading-tight hover:underline truncate relative z-10">{{ course.title }}</h3>
              </div>

              <!-- Teacher Avatar -->
              <div class="absolute right-4 top-[70px] z-20 group-hover:scale-110 transition-transform duration-300">
                  <div class="w-[70px] h-[70px] bg-indigo-500 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center shadow-sm text-3xl text-white font-normal overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                    @if (course.users?.avatar_url) {
                      <img [src]="course.users?.avatar_url" [alt]="course.users?.firstname" class="w-full h-full object-cover" />
                    } @else {
                      {{ course.users?.firstname?.[0]?.toUpperCase() || course.title[0]?.toUpperCase() || 'C' }}
                    }
                  </div>
              </div>

              <div class="flex-1 p-5 pt-12 flex flex-col">
                <p class="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-2 leading-relaxed flex-1">{{ course.description || 'Sem descrição' }}</p>
                @if (course.users?.firstname) {
                  <div class="mt-auto pt-2 mb-3 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <mat-icon class="text-[14px] w-[14px] h-[14px]">school</mat-icon>
                    Prof. {{ course.users?.firstname }} {{ course.users?.lastname }}
                  </div>
                }
                <div class="flex items-center justify-between mt-auto">
                  <span class="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full shadow-sm">
                    Acessar turma
                  </span>
                </div>
              </div>
            </div>
          }
        </div>
      }
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyCoursesPage implements OnInit {
  private enrollmentService = inject(EnrollmentService);
  private courseService = inject(CourseService);
  
  myCourses = signal<Course[]>([]);
  isLoading = signal<boolean>(true);

  async ngOnInit() {
    try {
      const enrolledIds = await this.enrollmentService.getEnrolledCourseIds();
      if (enrolledIds.length > 0) {
        const allCourses = await this.courseService.getCourses();
        const enrolledCourses = allCourses.filter(c => enrolledIds.includes(c.id));
        this.myCourses.set(enrolledCourses);
      } else {
        this.myCourses.set([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading.set(false);
    }
  }
}
