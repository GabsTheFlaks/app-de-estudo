import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
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

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, FormsModule],
  template: `
    <div class="flex flex-col items-center">
      <!-- Main Content -->
      <main class="w-full mx-auto flex-1 relative z-10 w-full px-2">
        
        @if (isLoading()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            @for (i of [1,2,3,4]; track i) {
              <div class="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col animate-pulse h-[300px]">
                <div class="h-[100px] bg-slate-200"></div>
                <div class="p-4 flex-1 flex flex-col relative pt-12">
                  <div class="absolute right-4 -top-8 w-16 h-16 bg-slate-300 rounded-full border-4 border-white"></div>
                  <div class="h-4 bg-slate-100 rounded w-1/4 mb-4"></div>
                  <div class="h-6 bg-slate-100 rounded w-3/4 mb-2"></div>
                </div>
              </div>
            }
          </div>
        } @else if (courses().length === 0) {
          <div class="text-center py-24 bg-white rounded-lg border border-slate-200 border-dashed">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <mat-icon class="text-3xl text-slate-400">menu_book</mat-icon>
            </div>
            <h3 class="text-lg font-medium text-slate-700">Nenhuma turma disponível</h3>
            <p class="mt-2 text-sm text-slate-500">Volte mais tarde para conferir novos conteúdos.</p>
          </div>
        } @else {
          <!-- Search + Filter Bar -->
          <div class="flex flex-col sm:flex-row gap-3 mb-6">
            <div class="relative flex-1">
              <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</mat-icon>
              <input
                type="text"
                [ngModel]="searchModel"
                (ngModelChange)="onSearchChange($event)"
                placeholder="Buscar turma..."
                class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            @if (categories().length > 0) {
              <select
                [ngModel]="categoryModel"
                (ngModelChange)="onCategoryChange($event)"
                class="px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="">Todas as categorias</option>
                @for (cat of categories(); track cat) {
                  <option [value]="cat">{{ cat }}</option>
                }
              </select>
            }
          </div>

          <!-- No results state -->
          @if (filteredCourses().length === 0) {
            <div class="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed">
              <mat-icon class="text-4xl text-slate-300 mb-3">search_off</mat-icon>
              <h3 class="text-slate-600 dark:text-slate-400 font-medium">Nenhuma turma encontrada</h3>
              <p class="text-sm text-slate-400 mt-1">Tente buscar por outro termo.</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              @for (course of filteredCourses(); track course.id) {
                <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col group hover:shadow-md transition-shadow h-[300px] relative group cursor-pointer" [routerLink]="['/course', course.id]">
                  
                  <!-- Card Header with Background Image/Color -->
                  <div class="h-32 bg-indigo-600 relative p-4 flex flex-col justify-between">
                    @if (course.thumbnail_url) {
                      <div class="absolute inset-0 opacity-40 mix-blend-overlay">
                        <img [src]="course.thumbnail_url" alt="" class="w-full h-full object-cover block" />
                      </div>
                    }
                    <div class="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    
                    <div class="relative z-10 flex justify-between items-start">
                      <span class="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-medium text-white border border-white/30 shadow-sm">{{ course.category || 'Sem Categoria' }}</span>
                      @if (isEnrolled(course.id)) {
                        <span class="px-2.5 py-1 bg-emerald-500/80 backdrop-blur-md rounded-lg text-xs font-medium text-white shadow-sm flex items-center gap-1">
                          <mat-icon class="text-[14px] w-[14px] h-[14px]">check_circle</mat-icon> Inscrito
                        </span>
                      }
                    </div>
                    <h3 class="text-white font-medium text-[20px] leading-tight hover:underline truncate relative z-10">{{ course.title }}</h3>
                  </div>

                  <!-- Teacher Avatar -->
                  <div class="absolute right-4 top-[70px] z-20">
                      <div class="w-[70px] h-[70px] bg-indigo-500 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center shadow-sm text-3xl text-white font-normal overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                        {{ course.title[0]?.toUpperCase() || 'C' }}
                      </div>
                  </div>

                  <!-- Content Area -->
                  <div class="flex-1 flex flex-col pt-12 px-4 pb-4">
                    <p class="text-[13px] text-slate-600 dark:text-slate-300 line-clamp-3">{{ course.description }}</p>
                  </div>
                  
                  <!-- Bottom Action Bar -->
                  <div class="h-12 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end px-2 py-1 space-x-1">
                    <button (click)="$event.stopPropagation(); openClassInfo(course.id)" class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-center" aria-label="Abrir resumo">
                      <mat-icon class="text-[20px]">assignment_ind</mat-icon>
                    </button>
                    <button (click)="$event.stopPropagation(); openFolder(course.id)" class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-center" aria-label="Abrir pasta">
                      <mat-icon class="text-[20px]">folder</mat-icon>
                    </button>
                    
                    @if (appUser()?.role === 'admin') {
                      <div class="relative">
                        <button (click)="$event.stopPropagation(); toggleCourseMenu(course.id)" class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-center" title="Opções">
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
        }
      </main>

      <!-- Onboarding Premium Welcome Overlay -->
      @if (showOnboarding()) {
        <div class="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="dismissOnboarding()"></div>
          
          <!-- Modal Card -->
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md relative z-10 overflow-hidden transform scale-100 animate-scale-up duration-300 ease-out">
            <div class="bg-gradient-to-br from-indigo-600 to-purple-600 p-8 text-white text-center relative">
              <div class="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner">
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
                  <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200">Avalie & Apoie</h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">Salve materiais nos seus favoritos e avalie com estrelas os melhores conteúdos.</p>
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

  // Search/filter state
  searchQuery = signal('');
  selectedCategory = signal('');

  filteredCourses = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    return this.courses().filter(c => {
      const matchesSearch = !q || c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
      const matchesCat = !cat || c.category === cat;
      return matchesSearch && matchesCat;
    });
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

  // Search/filter model properties (ngModel bridges to signals)
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

  async ngOnInit() {
    const shown = localStorage.getItem('sima_onboarding_shown');
    if (!shown) {
      setTimeout(() => this.showOnboarding.set(true), 800);
    }
    await this.fetchCourses();
  }

  dismissOnboarding() {
    localStorage.setItem('sima_onboarding_shown', 'true');
    this.showOnboarding.set(false);
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

  toggleCourseMenu(id: string) {
    this.activeCourseMenu.update(v => v === id ? null : id);
  }

  getIconType(type: string): string {
    return this.embedService.getIconForFileType(type);
  }

  getBadgeClasses(type: string): string {
    return this.embedService.getBadgeClasses(type);
  }

  async logout() {
    await this.supabase.client.auth.signOut();
    this.router.navigate(['/login']);
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
    // Navigate to course detail page (files route doesn't exist)
    this.router.navigate(['/course', id]);
  }
}
