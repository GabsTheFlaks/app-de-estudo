import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { CourseService } from '../../core/services/course.service';
import { Course } from '../../core/models/interfaces';
import { EmbedUrlService } from '../../shared/utils/embed-url.service';
import { DialogService } from '../../shared/components/dialog/dialog.service';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../shared/services/toast.service';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { TourService } from '../../shared/services/tour.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full animate-fade-in">

      <!-- Layout Columns -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <!-- Left Column: Search, Filters, and Course Cards Grid (takes 3 columns) -->
        <div class="lg:col-span-3 space-y-6">



          <!-- Search + Filter Bar -->
          <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">

            <!-- Search Text -->
            <div class="relative flex-1">
              <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</mat-icon>
              <input
                type="text"
                [ngModel]="searchModel"
                (ngModelChange)="onSearchChange($event)"
                placeholder="Buscar turma por título..."
                class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <!-- Category Selector -->
            @if (categories().length > 0) {
              <select
                [ngModel]="categoryModel"
                (ngModelChange)="onCategoryChange($event)"
                class="w-full sm:w-auto px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="">Todas as categorias</option>
                @for (cat of categories(); track cat) {
                  <option [value]="cat">{{ cat }}</option>
                }
              </select>
            }

            <!-- Enrollment Filter Status [Item 1] -->
            <div class="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl w-full sm:w-auto">
              <button
                (click)="filterEnrollment.set('all')"
                [class]="filterEnrollment() === 'all' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-700 dark:text-white font-semibold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
                class="flex-1 sm:flex-initial px-4 py-1.5 text-xs rounded-lg transition-all cursor-pointer">
                Todas
              </button>
              <button
                (click)="filterEnrollment.set('enrolled')"
                [class]="filterEnrollment() === 'enrolled' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-700 dark:text-white font-semibold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
                class="flex-1 sm:flex-initial px-4 py-1.5 text-xs rounded-lg transition-all cursor-pointer">
                Inscrito
              </button>
              <button
                (click)="filterEnrollment.set('not_enrolled')"
                [class]="filterEnrollment() === 'not_enrolled' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-700 dark:text-white font-semibold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
                class="flex-1 sm:flex-initial px-4 py-1.5 text-xs rounded-lg transition-all cursor-pointer">
                Não Inscrito
              </button>
            </div>
          </div>

          <!-- Active Teacher Filter Chip [Item 10] -->
          @if (selectedInstructor()) {
            <div class="flex items-center gap-2 animate-fade-in">
              <span class="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-full border border-indigo-200 dark:border-indigo-800 shadow-sm">
                <mat-icon class="text-[14px] w-[14px] h-[14px]">school</mat-icon>
                Professor: {{ selectedInstructor() }}
                <button (click)="clearInstructorFilter()" class="hover:text-indigo-900 dark:hover:text-white font-bold ml-1 transition-colors cursor-pointer" title="Remover filtro (Esc)">
                  <mat-icon class="text-[14px] w-[14px] h-[14px] flex items-center justify-center">close</mat-icon>
                </button>
              </span>
            </div>
          }

          <!-- Course Cards Grid -->
          @if (filteredCourses().length === 0) {
            <div class="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed animate-fade-in">
              <mat-icon class="text-5xl text-slate-300 dark:text-slate-600 mb-3 animate-pulse">search_off</mat-icon>
              <h3 class="text-slate-600 dark:text-slate-400 font-bold text-lg">Nenhuma turma encontrada</h3>
              <p class="text-sm text-slate-400 mt-1">Tente ajustar seus critérios de busca ou filtros.</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-fade-in">
              @for (course of filteredCourses(); track course.id) {
                <div
                  class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300 h-[320px] relative cursor-pointer"
                  [routerLink]="['/course', course.id]"
                >
                  <!-- Card Header with Background Image/Color -->
                  <div class="h-32 bg-indigo-600 relative p-4 flex flex-col justify-between overflow-hidden">
                    @if (course.thumbnail_url) {
                      <div class="absolute inset-0 opacity-40 mix-blend-overlay group-hover:scale-105 transition-transform duration-500">
                        <img [src]="course.thumbnail_url" alt="" class="w-full h-full object-cover block" />
                      </div>
                    }
                    <div class="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    
                    <div class="relative z-10 flex justify-between items-start">
                      <span class="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-semibold text-white border border-white/30 shadow-sm">{{ course.category || 'Sem Categoria' }}</span>

                      <div class="flex items-center gap-1.5">
                        <!-- Pulsating Bell Alerter [Item 5] -->
                        @if (hasNewLessons(course.id)) {
                          <span class="p-1 rounded-lg bg-red-500 text-white animate-bounce flex items-center justify-center shadow-lg shadow-red-500/20" title="Novidades postadas após seu último acesso!">
                            <mat-icon class="text-[16px] w-[16px] h-[16px]">notifications_active</mat-icon>
                          </span>
                        }

                        @if (isEnrolled(course.id)) {
                          <span class="px-2.5 py-1 bg-emerald-500/80 backdrop-blur-md rounded-lg text-xs font-semibold text-white shadow-sm flex items-center gap-1">
                            <mat-icon class="text-[14px] w-[14px] h-[14px]">check_circle</mat-icon> Inscrito
                          </span>
                        }
                      </div>
                    </div>
                    <h3 class="text-white font-bold text-lg leading-tight hover:underline truncate relative z-10 tracking-wide">{{ course.title }}</h3>
                  </div>

                  <!-- Teacher Avatar / Trigger Teacher Filter [Item 10] -->
                  <div
                    (click)="toggleInstructorFilter(course.users?.firstname, $event)"
                    class="absolute right-4 top-[70px] z-20 group-hover:scale-110 transition-transform duration-300 cursor-pointer"
                    [title]="course.users?.firstname ? 'Filtrar por Prof. ' + course.users?.firstname : 'Sem professor atribuído'"
                  >
                    <div class="w-[66px] h-[66px] bg-indigo-500 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center shadow-md text-2xl text-white font-bold overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                      @if (course.users?.avatar_url) {
                        <img [src]="course.users?.avatar_url" [alt]="course.users?.firstname" class="w-full h-full object-cover" />
                      } @else {
                        {{ course.users?.firstname?.[0]?.toUpperCase() || 'P' }}
                      }
                    </div>
                  </div>

                  <!-- Content Area -->
                  <div class="flex-1 flex flex-col pt-12 px-4 pb-4">
                    <p class="text-[13px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed font-medium">{{ course.description }}</p>

                    @if (course.users?.firstname) {
                      <div class="mt-auto pt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <mat-icon class="text-[14px] w-[14px] h-[14px] text-indigo-500 dark:text-indigo-400">school</mat-icon>
                        Prof. {{ course.users?.firstname }} {{ course.users?.lastname }}
                      </div>
                    }
                  </div>
                  
                  <!-- Bottom Action Bar -->
                  <div class="h-12 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-end px-2 py-1 space-x-1 bg-slate-50/50 dark:bg-slate-800/40">
                    <!-- Pinned shortcut trigger [Item 4] -->
                    <button
                      (click)="$event.stopPropagation(); togglePinCourse(course.id, $event)"
                      class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-center cursor-pointer"
                      [class.text-amber-500]="isPinned(course.id)"
                      [class.dark:text-amber-400]="isPinned(course.id)"
                      [title]="isPinned(course.id) ? 'Remover dos atalhos' : 'Fixar no menu lateral'"
                    >
                      <mat-icon class="text-[20px]" [class.fill-current]="isPinned(course.id)">
                        {{ isPinned(course.id) ? 'star' : 'star_border' }}
                      </mat-icon>
                    </button>

                    <button (click)="$event.stopPropagation(); openClassInfo(course.id)" class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-center cursor-pointer" aria-label="Abrir resumo">
                      <mat-icon class="text-[20px]">assignment_ind</mat-icon>
                    </button>
                    <button (click)="$event.stopPropagation(); openFolder(course.id)" class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-center cursor-pointer" aria-label="Abrir pasta">
                      <mat-icon class="text-[20px]">folder</mat-icon>
                    </button>
                    
                    @if (appUser()?.role === 'admin') {
                      <div class="relative">
                        <button (click)="$event.stopPropagation(); toggleCourseMenu(course.id)" class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-center cursor-pointer" title="Opções">
                          <mat-icon class="text-[20px]">more_vert</mat-icon>
                        </button>
                        
                        @if (activeCourseMenu() === course.id) {
                          <div class="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1 origin-bottom-right">
                            <button (click)="$event.stopPropagation(); renameCourse(course)" class="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm flex items-center">
                              <mat-icon class="mr-2 text-[18px]">edit</mat-icon> Editar Nome
                            </button>
                            <button (click)="$event.stopPropagation(); deleteCourse(course.id)" class="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-red-600 dark:text-red-400 text-sm flex items-center">
                              <mat-icon class="mr-2 text-[18px]">delete</mat-icon> Excluir
                            </button>
                          </div>
                          <div class="fixed inset-0 z-40 cursor-default" (click)="$event.stopPropagation(); activeCourseMenu.set(null)" (keyup.enter)="$event.stopPropagation(); activeCourseMenu.set(null)" tabindex="0"></div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Right Column: Interactive Planner & News Feed Sidebar [Item 7, 8] -->
        <div class="space-y-6">

          <!-- Cronograma Semanal - Planner Widget [Item 7] -->
          <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <mat-icon class="text-indigo-500 text-[20px] w-[20px] h-[20px]">calendar_month</mat-icon>
                Planner de Estudos
              </h2>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Semanal</span>
            </div>

            <!-- Planner Days list -->
            <div class="space-y-2.5">
              @for (day of weekDays; track day.key) {
                <div
                  [class.ring-2]="isToday(day.key)"
                  [class.ring-indigo-500]="isToday(day.key)"
                  class="p-3 bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-800 rounded-xl relative transition-all"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span
                        [class.bg-indigo-600]="isToday(day.key)"
                        [class.text-white]="isToday(day.key)"
                        [class.bg-slate-200]="!isToday(day.key)"
                        [class.text-slate-600]="!isToday(day.key)"
                        class="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                      >
                        {{ day.label[0] }}
                      </span>
                      {{ day.label }}
                    </span>

                    <button
                      (click)="togglePlannerDay(day.key)"
                      class="text-indigo-500 hover:text-indigo-700 p-0.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer"
                    >
                      <mat-icon class="text-[16px] w-[16px] h-[16px]">add</mat-icon>
                    </button>
                  </div>

                  <!-- Enrolled Scheduled items -->
                  <div class="space-y-1">
                    @for (courseId of weeklyPlanner()[day.key] || []; track courseId) {
                      @if (getCourseTitle(courseId)) {
                        <a
                          [routerLink]="['/course', courseId]"
                          class="block text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 hover:underline truncate bg-indigo-50/50 dark:bg-indigo-950/20 px-2 py-0.5 rounded border border-indigo-100/50 dark:border-indigo-900/30"
                        >
                          📚 {{ getCourseTitle(courseId) }}
                        </a>
                      }
                    } @empty {
                      <span class="text-[10px] text-slate-400 italic">Nenhuma matéria agendada</span>
                    }
                  </div>

                  <!-- Sleek Popover checklist selector for courses [Item 7] -->
                  @if (activePlannerDay() === day.key) {
                    <div class="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[100] p-3 space-y-2 animate-scale-up">
                      <div class="flex justify-between items-center pb-1.5 border-b border-slate-100 dark:border-slate-700">
                        <span class="text-xs font-bold text-slate-800 dark:text-white">Estudar na {{ day.label }}:</span>
                        <button (click)="togglePlannerDay(day.key)" class="text-slate-400 hover:text-slate-600">
                          <mat-icon class="text-[14px] w-[14px] h-[14px]">close</mat-icon>
                        </button>
                      </div>

                      <div class="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                        @for (course of enrolledCourses(); track course.id) {
                          <label class="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer text-xs transition-colors">
                            <input
                              type="checkbox"
                              [checked]="isPlanned(day.key, course.id)"
                              (change)="togglePlannerCourse(day.key, course.id)"
                              class="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <span class="truncate font-semibold text-slate-700 dark:text-slate-300">{{ course.title }}</span>
                          </label>
                        } @empty {
                          <span class="text-[10px] text-slate-400 block text-center py-2">Inscreva-se em turmas na Home para planejar seus estudos!</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Feed Global de Novidades [Item 8] -->
          <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <mat-icon class="text-emerald-500 text-[20px] w-[20px] h-[20px]">notifications</mat-icon>
                Novidades Recentes
              </h2>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Feed</span>
            </div>

            <div class="space-y-4 border-l-2 border-slate-100 dark:border-slate-800 pl-4 ml-2 relative">
              @for (lesson of feedLessons(); track lesson.id) {
                <div class="relative group">
                  <!-- Bullet marker -->
                  <div class="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform"></div>

                  <a [routerLink]="['/lesson', lesson.id, 'viewer']" class="block space-y-0.5">
                    <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {{ lesson.courses?.title || 'Curso' }}
                    </span>
                    <h4 class="text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1">
                      {{ lesson.title }}
                    </h4>
                    <span class="text-[9px] text-slate-400 block">
                      {{ formatTimeAgo(lesson.created_at) }}
                    </span>
                  </a>
                </div>
              } @empty {
                <div class="py-4 text-center text-slate-400 text-xs italic">
                  Nenhuma aula recente postada nas suas turmas
                </div>
              }
            </div>
          </div>

        </div>

      </div>

      <!-- Onboarding Premium Welcome Overlay -->
      @if (showOnboarding()) {
        <div class="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="dismissOnboarding()"></div>
          
          <!-- Modal Card -->
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md relative z-10 overflow-hidden transform scale-100 animate-scale-up duration-300 ease-out">
            <div class="bg-gradient-to-br from-indigo-600 to-purple-600 p-8 text-white text-center relative">
              <div class="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner animate-bounce">
                <mat-icon class="text-4xl">rocket_launch</mat-icon>
              </div>
              <h2 class="text-2xl font-bold tracking-tight">Bem-vindo ao SIMA!</h2>
              <p class="text-indigo-100 text-sm mt-1">Sua jornada rumo à excelência começa hoje.</p>
            </div>
            
            <div class="p-6 space-y-5">
              <div class="flex items-start gap-4">
                <div class="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                  <mat-icon class="text-[20px]">dashboard</mat-icon>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200">Explore suas Turmas</h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">Aqui no painel, você confere todos os treinamentos, pesquisa aulas e filtra por categorias.</p>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div class="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                  <mat-icon class="text-[20px]">trending_up</mat-icon>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200">Acompanhe sua Evolução</h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">Entre em uma turma, inscreva-se e conclua as aulas para progredir seu status na trilha.</p>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div class="w-8 h-8 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                  <mat-icon class="text-[20px]">star</mat-icon>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200">Planejamento & Acessibilidade</h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">Agende seus estudos semanais no Planner e utilize o novo menu de acessibilidade e foco.</p>
                </div>
              </div>
            </div>
            
            <div class="px-6 pb-6 flex flex-col">
              <button (click)="dismissOnboarding()" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer">
                <span>Começar Minha Jornada</span>
                <mat-icon class="text-[18px] w-[18px] h-[18px]">arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  private supabase = inject(SupabaseService);
  private courseService = inject(CourseService);
  private router = inject(Router);
  protected embedService = inject(EmbedUrlService);
  private dialog = inject(DialogService);
  private toast = inject(ToastService);
  private enrollmentService = inject(EnrollmentService);
  private platformId = inject(PLATFORM_ID);
  private tourService = inject(TourService);

  // Week Days configuration
  weekDays = [
    { key: 'seg', label: 'Segunda' },
    { key: 'ter', label: 'Terça' },
    { key: 'qua', label: 'Quarta' },
    { key: 'qui', label: 'Quinta' },
    { key: 'sex', label: 'Sexta' },
    { key: 'sab', label: 'Sábado' },
    { key: 'dom', label: 'Domingo' }
  ];

  // Search/Filter signals
  searchQuery = signal('');
  selectedCategory = signal('');
  selectedInstructor = signal<string | null>(null);
  filterEnrollment = signal<'all' | 'enrolled' | 'not_enrolled'>('all');

  // Pinned courses shortcuts [Item 4]
  pinnedCourseIds = signal<Set<string>>(new Set());

  // Planner Signals [Item 7]
  weeklyPlanner = signal<Record<string, string[]>>({});
  activePlannerDay = signal<string | null>(null);

  // Global News Feed signals [Item 8]
  feedLessons = signal<any[]>([]);

  // Sino de Novidades map [Item 5]
  latestLessonMap = signal<Record<string, string>>({});

  filteredCourses = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    const inst = this.selectedInstructor();
    const enroll = this.filterEnrollment();

    return this.courses().filter(c => {
      const matchesSearch = !q || c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
      const matchesCat = !cat || c.category === cat;

      // Match instructor first name correctly via courses joined table
      const matchesInst = !inst || c.users?.firstname === inst;

      let matchesEnroll = true;
      if (enroll === 'enrolled') {
        matchesEnroll = this.isEnrolled(c.id);
      } else if (enroll === 'not_enrolled') {
        matchesEnroll = !this.isEnrolled(c.id);
      }

      return matchesSearch && matchesCat && matchesInst && matchesEnroll;
    });
  });

  enrolledCourses = computed(() => {
    return this.courses().filter(c => this.isEnrolled(c.id));
  });

  categories = computed(() => {
    const cats = [...new Set(this.courses().map(c => c.category).filter(Boolean))];
    return cats.sort();
  });

  appUser = this.supabase.appUser;
  courses = signal<Course[]>([]);
  enrolledCourseIds = signal<Set<string>>(new Set());
  isLoading = signal<boolean>(true);
  activeCourseMenu = signal<string | null>(null);
  showOnboarding = signal<boolean>(false);

  isEnrolled(courseId: string): boolean {
    return this.enrolledCourseIds().has(courseId);
  }

  isPinned(courseId: string): boolean {
    return this.pinnedCourseIds().has(courseId);
  }

  // Escape key toggle reset for teacher filter [Item 10]
  @HostListener('document:keydown.escape')
  onEscape() {
    this.clearInstructorFilter();
  }

  // Search/filter models
  searchModel = '';
  categoryModel = '';

  onSearchChange(val: string) {
    this.searchModel = val;
    this.searchQuery.set(val);
  }

  onCategoryChange(val: string) {
    this.categoryModel = val;
    this.selectedCategory.set(val);
  }

  toggleInstructorFilter(name: string | undefined, event: Event) {
    event.stopPropagation(); // Avoid navigating to class page
    if (!name) return;
    this.selectedInstructor.update(curr => curr === name ? null : name);
    this.toast.info(this.selectedInstructor() ? `Exibindo turmas de Prof. ${name}` : 'Filtro de professor removido.');
  }

  clearInstructorFilter() {
    if (this.selectedInstructor()) {
      this.selectedInstructor.set(null);
      this.toast.info('Filtro de professor limpo.');
    }
  }

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const shown = localStorage.getItem('sima_onboarding_shown');
      if (!shown) {
        setTimeout(() => this.showOnboarding.set(true), 800);
      }
    }
    await this.fetchCourses();
    this.loadPinnedCourses();
    await this.loadPlanner();
    await this.checkNewLessons();
    await this.loadFeed();
  }

  dismissOnboarding() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('sima_onboarding_shown', 'true');
    }
    this.showOnboarding.set(false);
    setTimeout(() => {
      this.tourService.start();
    }, 300);
  }

  async fetchCourses() {
    let loadingTimeout: ReturnType<typeof setTimeout> | null = null;
    try {
      if (this.courses().length === 0) {
        loadingTimeout = setTimeout(() => this.isLoading.set(true), 200);
      }
      const [data, enrolledIds] = await Promise.all([
        this.courseService.getCourses(),
        this.enrollmentService.getEnrolledCourseIds()
      ]);
      if (loadingTimeout) clearTimeout(loadingTimeout);
      this.isLoading.set(false);
      this.courses.set(data);
      this.enrolledCourseIds.set(new Set(enrolledIds));
    } catch (e) {
      console.error(e);
      if (loadingTimeout) clearTimeout(loadingTimeout);
      this.isLoading.set(false);
    }
  }

  // Pin shortcuts logic [Item 4]
  loadPinnedCourses() {
    if (!isPlatformBrowser(this.platformId)) return;
    const raw = localStorage.getItem('sima_pinned_courses');
    if (raw) {
      this.pinnedCourseIds.set(new Set(JSON.parse(raw)));
    }
  }

  togglePinCourse(courseId: string, event: Event) {
    event.stopPropagation();
    const current = new Set(this.pinnedCourseIds());
    if (current.has(courseId)) {
      current.delete(courseId);
      this.toast.info('Turma removida dos atalhos!');
    } else {
      current.add(courseId);
      this.toast.success('Turma adicionada aos atalhos da barra lateral!');
    }
    this.pinnedCourseIds.set(current);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('sima_pinned_courses', JSON.stringify(Array.from(current)));
      window.dispatchEvent(new Event('sima_pinned_changed'));
    }
  }

  // Planner DB integrations [Item 7]
  async loadPlanner() {
    try {
      const { data, error } = await this.supabase.client
        .from('student_planner')
        .select('week_day, course_id');

      if (error) {
        console.warn('[Planner] Erro ao carregar planner:', error);
        return;
      }

      // Group by week day
      const grouped = (data || []).reduce((acc, row) => {
        if (!acc[row.week_day]) acc[row.week_day] = [];
        acc[row.week_day].push(row.course_id);
        return acc;
      }, {} as Record<string, string[]>);

      this.weeklyPlanner.set(grouped);
    } catch (e) {
      console.warn('[Planner] Exceção ao carregar planner:', e);
    }
  }

  async togglePlannerCourse(weekDay: string, courseId: string) {
    const current = this.weeklyPlanner()[weekDay] ?? [];
    const exists = current.includes(courseId);

    try {
      if (exists) {
        await this.supabase.client
          .from('student_planner')
          .delete()
          .eq('week_day', weekDay)
          .eq('course_id', courseId);
        this.toast.info('Item removido do planner semanal!');
      } else {
        const { data: { user } } = await this.supabase.client.auth.getUser();
        if (user) {
          await this.supabase.client
            .from('student_planner')
            .insert({
              user_id: user.id,
              week_day: weekDay,
              course_id: courseId
            });
          this.toast.success('Item adicionado ao planner semanal!');
        }
      }

      // Reload from Supabase DB to refresh UI signal
      await this.loadPlanner();
    } catch (e) {
      console.error(e);
      this.toast.error('Erro ao salvar alterações no planner.');
    }
  }

  isPlanned(day: string, courseId: string): boolean {
    return this.weeklyPlanner()[day]?.includes(courseId) ?? false;
  }

  getCourseTitle(courseId: string): string {
    return this.courses().find(c => c.id === courseId)?.title || '';
  }

  togglePlannerDay(day: string) {
    this.activePlannerDay.update(d => d === day ? null : day);
  }

  isToday(dayKey: string): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const daysMap: Record<number, string> = {
      1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab', 0: 'dom'
    };
    return daysMap[new Date().getDay()] === dayKey;
  }

  // News Feed integrations [Item 8]
  async loadFeed() {
    if (this.enrolledCourseIds().size === 0) {
      this.feedLessons.set([]);
      return;
    }
    try {
      const idsArray = Array.from(this.enrolledCourseIds());
      const { data, error } = await this.supabase.client
        .from('lessons')
        .select('id, course_id, title, created_at, courses(title)')
        .in('course_id', idsArray)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        this.feedLessons.set(data as any[]);
      }
    } catch (e) {
      console.warn('[Feed] Erro ao carregar feed de novidades:', e);
    }
  }

  formatTimeAgo(dateStr: string): string {
    const past = new Date(dateStr);
    const diffMs = new Date().getTime() - past.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 6000);

    if (diffMin < 60) return `Há ${diffMin} min`;
    if (diffHours < 24) return `Há ${diffHours} h`;
    return past.toLocaleDateString('pt-BR');
  }

  // Pulsating Bell checking [Item 5]
  async checkNewLessons() {
    try {
      const { data, error } = await this.supabase.client
        .from('lessons')
        .select('course_id, created_at')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const latestMap: Record<string, string> = {};
        for (const item of data) {
          if (!latestMap[item.course_id]) {
            latestMap[item.course_id] = item.created_at;
          }
        }
        this.latestLessonMap.set(latestMap);
      }
    } catch (e) {
      console.warn('[Sino] Erro ao verificar aulas recentes:', e);
    }
  }

  hasNewLessons(courseId: string): boolean {
    if (!this.isEnrolled(courseId)) return false;
    const latestDateStr = this.latestLessonMap()[courseId];
    if (!latestDateStr) return false;

    if (!isPlatformBrowser(this.platformId)) return false;
    const lastViewedStr = localStorage.getItem(`sima_course_last_viewed_${courseId}`);
    if (!lastViewedStr) return true; // Never viewed, so it's a notification

    return new Date(latestDateStr) > new Date(lastViewedStr);
  }

  toggleCourseMenu(id: string) {
    this.activeCourseMenu.update(v => v === id ? null : id);
  }

  async deleteCourse(id: string) {
    this.activeCourseMenu.set(null);
    const confirmed = await this.dialog.confirm({
      title: 'Excluir turma',
      message: 'Tem certeza que deseja apagar esta turma e todos os seus materiais? Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      danger: true
    });
    if (confirmed) {
      try {
        await this.courseService.deleteCourse(id);
        await this.fetchCourses();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
        console.error("Erro ao deletar:", err);
        await this.dialog.alert({ title: 'Erro', message: 'Erro ao deletar a turma: ' + errorMsg, danger: true });
      }
    }
  }

  async renameCourse(course: Course) {
    this.activeCourseMenu.set(null);
    const newTitle = await this.dialog.prompt({
      title: 'Renomear turma',
      message: 'Digite o novo nome para a turma:',
      inputDefault: course.title,
      inputPlaceholder: 'Nome da turma',
      confirmLabel: 'Renomear'
    });
    if (newTitle && newTitle.trim() !== '' && newTitle !== course.title) {
       try {
         await this.courseService.updateCourseTitle(course.id, newTitle.trim());
         await this.fetchCourses();
       } catch(err) {
         console.error("Erro ao renomear:", err);
         await this.dialog.alert({ title: 'Erro', message: 'Erro ao renomear a turma.', danger: true });
       }
    }
  }

  openClassInfo(id: string) {
    this.router.navigate(['/course', id]);
  }

  openFolder(id: string) {
    this.router.navigate(['/course', id]);
  }
}
