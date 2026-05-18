import { Component, OnInit, OnDestroy, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { CourseService } from '../../core/services/course.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Course, Lesson } from '../../core/models/interfaces';
import { DialogService } from '../../shared/components/dialog/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { ProgressService } from '../../core/services/progress.service';

@Component({
  selector: 'app-class-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, DatePipe, SkeletonComponent, DragDropModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
      @if (isLoading()) {
        <!-- Skeleton Loading -->
        <div class="space-y-6">
          <app-skeleton height="240px" radius="xl" cssClass="mb-6"></app-skeleton>
          <div class="flex gap-4">
            <app-skeleton height="2.5rem" width="120px" radius="full"></app-skeleton>
            <app-skeleton height="2.5rem" width="120px" radius="full"></app-skeleton>
          </div>
          <div class="grid grid-cols-1 gap-3">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <app-skeleton width="56px" height="56px" radius="lg"></app-skeleton>
                <div class="flex-1 space-y-2">
                  <app-skeleton height="1rem" width="60%"></app-skeleton>
                  <app-skeleton height="0.75rem" width="40%"></app-skeleton>
                </div>
              </div>
            }
          </div>
        </div>
      } @else if (error() || !course()) {
        <div class="flex-1 flex flex-col items-center justify-center text-slate-500 p-12 text-center max-w-sm mx-auto h-[60vh]">
          <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
            <mat-icon class="text-3xl">error_outline</mat-icon>
          </div>
          <h2 class="text-xl font-medium text-slate-800 mb-2">Turma não encontrada</h2>
          <p class="mb-8 text-sm">O conteúdo que você tentou acessar não existe.</p>
          <a routerLink="/dashboard" class="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all text-sm">
            <mat-icon class="mr-2 text-[20px]">arrow_back</mat-icon>
            Voltar ao Início
          </a>
        </div>
      } @else {
        <!-- Banner -->
        <div class="h-[240px] rounded-2xl bg-indigo-600 relative overflow-hidden p-6 flex flex-col justify-end shadow-sm">
          @if (course()!.thumbnail_url) {
            <div class="absolute inset-0 opacity-40 mix-blend-overlay">
              <img [src]="course()!.thumbnail_url" alt="" class="w-full h-full object-cover block" />
            </div>
          }
          <div class="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
          
          <div class="relative z-10">
            <h1 class="text-3xl sm:text-4xl font-medium text-white tracking-tight">{{ course()!.title }}</h1>
            <p class="text-lg sm:text-xl text-white/90 mt-1 font-medium">{{ course()!.category }}</p>
            
            <div class="mt-4 flex items-center gap-4">
              @if (isEnrolled()) {
                <button (click)="unenroll()" class="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-sm font-medium transition-colors backdrop-blur-md">
                  Inscrito
                </button>
                @if (hasLessons()) {
                  <div class="flex-1 max-w-xs">
                    <div class="flex justify-between text-white/90 text-xs mb-1.5 font-medium">
                      <span>Progresso</span>
                      <span>{{ completedLessonsCount() }} / {{ lessons().length }}</span>
                    </div>
                    <div class="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                      <div class="h-full bg-emerald-400 transition-all duration-500 ease-out" [style.width]="progressPercentage() + '%'"></div>
                    </div>
                  </div>
                }
              } @else {
                <button (click)="enroll()" class="px-5 py-2.5 bg-white text-indigo-700 hover:bg-slate-50 border border-white rounded-xl text-sm font-medium shadow-sm transition-all shadow-indigo-900/20">
                  Inscrever-se
                </button>
              }
            </div>
          </div>
          
          <!-- Teacher Avatar -->
          <div class="absolute top-6 right-6 z-20">
             <div class="w-14 h-14 bg-indigo-500 rounded-full border-4 border-white/30 flex items-center justify-center shadow-lg overflow-hidden transition-transform hover:scale-110">
               @if (course()?.users?.avatar_url) {
                 <img [src]="course()!.users!.avatar_url" class="w-full h-full object-cover" [alt]="course()!.users!.firstname" />
               } @else {
                 <span class="text-white font-bold text-xl">{{ course()!.users?.firstname?.[0] || 'P' }}</span>
               }
             </div>
          </div>
        </div>

        <div class="mt-6 relative">
          <!-- Main Content (Stream) -->
          <div class="space-y-4 w-full max-w-4xl mx-auto">
            
            <!-- Mural de Avisos da Turma -->
            @if (course()?.announcement) {
              <div class="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 sm:p-5 shadow-sm relative flex flex-col sm:flex-row gap-4 items-start group backdrop-blur-sm animate-fade-in">
                <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 border border-amber-200/50 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-full flex items-center justify-center shrink-0">
                  <mat-icon class="animate-pulse">campaign</mat-icon>
                </div>
                <div class="flex-1 min-w-0 pt-0.5">
                  <h3 class="text-[10px] font-bold text-amber-800 dark:text-amber-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span class="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Comunicado Importante
                  </h3>
                  <p class="text-sm text-amber-950 dark:text-amber-100 leading-relaxed font-medium whitespace-pre-wrap">{{ course()?.announcement }}</p>
                </div>
                
                @if (appUser()?.role === 'admin') {
                  <div class="flex items-center gap-1 self-end sm:self-start lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0">
                    <button (click)="editAnnouncement()" class="p-1.5 text-slate-500 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition-colors cursor-pointer" title="Editar comunicado">
                      <mat-icon class="text-[18px] w-[18px] h-[18px] flex items-center">edit</mat-icon>
                    </button>
                    <button (click)="removeAnnouncement()" class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-colors cursor-pointer" title="Excluir comunicado">
                      <mat-icon class="text-[18px] w-[18px] h-[18px] flex items-center">delete</mat-icon>
                    </button>
                  </div>
                }
              </div>
            } @else if (appUser()?.role === 'admin') {
              <!-- Adicionar Mural Rápido para Admin -->
              <div class="flex justify-end px-1">
                <button (click)="editAnnouncement()" class="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline flex items-center gap-1 py-1 transition-colors cursor-pointer bg-transparent">
                  <mat-icon class="text-[16px] w-[16px] h-[16px] flex items-center">add_alert</mat-icon> Adicionar Mural
                </button>
              </div>
            }
            
            <!-- Add Material Form Trigger (Only for Admin) -->
            @if (appUser()?.role === 'admin') {
              <div 
                [routerLink]="['/course', course()!.id, 'lesson', 'new']"
                class="bg-white border border-slate-200 rounded-[30px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] px-5 py-4 flex items-center hover:bg-slate-50 hover:shadow-[0_2px_4px_rgba(0,0,0,0.08)] cursor-pointer transition-all"
              >
                <div class="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center mr-4 shrink-0 shadow-inner">
                  <mat-icon class="text-[20px]">post_add</mat-icon>
                </div>
                <span class="text-slate-500 font-medium text-[15px]">Escreva um aviso, poste um material ou crie uma aula...</span>
              </div>
            }

            <!-- Legacy Course Material (If exists) -->
            @if (course()!.link_drive && !hasLessons()) {
               <div class="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col hover:bg-slate-50 transition-colors group relative">
                 <a [routerLink]="['/course', course()!.id, 'viewer']" class="px-5 py-4 flex items-start sm:items-center justify-between cursor-pointer w-full">
                   <div class="flex items-start sm:items-center space-x-4">
                      <div class="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shrink-0">
                         <mat-icon>bookmark</mat-icon>
                      </div>
                      <div>
                         <h4 class="text-slate-800 font-medium text-[15px] group-hover:underline w-full pt-2 sm:pt-0 pr-8 sm:pr-0">O coordenador postou o material principal da turma</h4>
                         <p class="text-slate-500 text-[13px] mt-0.5">Visão Geral</p>
                      </div>
                   </div>
                 </a>
                 <div class="absolute right-4 top-4 sm:top-auto z-10">
                    <button aria-label="Opções do material" (click)="$event.preventDefault(); $event.stopPropagation(); toggleLegacyMenu()" class="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors shrink-0">
                       <mat-icon>more_vert</mat-icon>
                    </button>
                    @if (activeLegacyMenu()) {
                      <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 py-1 origin-top-right">
                        @if (appUser()?.role === 'admin') {
                           <button (click)="$event.stopPropagation(); editLegacy()" class="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm flex items-center">
                              <mat-icon class="mr-2 text-[18px]">edit</mat-icon> Editar Link
                           </button>
                           <button  (click)="$event.stopPropagation(); deleteLegacy()" class="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-red-600 dark:text-red-400 text-sm flex items-center">
                              <mat-icon class="mr-2 text-[18px]">delete</mat-icon> Excluir
                           </button>
                        } @else {
                           <button (click)="$event.stopPropagation(); activeLegacyMenu.set(false)" class="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm flex items-center">
                              <mat-icon class="mr-2 text-[18px]">close</mat-icon> Fechar Menu
                           </button>
                        }
                      </div>
                      <div class="fixed inset-0 z-40 cursor-default" (click)="$event.stopPropagation(); activeLegacyMenu.set(false)" (keyup.enter)="$event.stopPropagation(); activeLegacyMenu.set(false)" tabindex="0"></div>
                    }
                 </div>
               </div>
            }

            <!-- Lessons List -->
            <div cdkDropList (cdkDropListDropped)="drop($event)" class="space-y-4">
              @for (lesson of lessons(); track lesson.id) {
                 <div cdkDrag [cdkDragDisabled]="appUser()?.role !== 'admin'" class="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col hover:bg-slate-50 transition-colors group relative">
                   
                   <!-- Custom Drag Placeholder -->
                   <div *cdkDragPlaceholder class="opacity-30 border-2 border-dashed border-indigo-300 rounded-xl min-h-[80px] bg-indigo-50"></div>

                   <div class="flex w-full">
                     <!-- Drag Handle (Apenas Admin) -->
                     @if (appUser()?.role === 'admin') {
                       <div cdkDragHandle class="cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-500 bg-slate-50 hover:bg-indigo-50 p-2 sm:px-4 shrink-0 flex items-center justify-center border-r border-slate-100 rounded-l-xl transition-colors" title="Arrastar para reordenar">
                         <mat-icon>drag_indicator</mat-icon>
                       </div>
                     }
                     
                     <div class="flex-grow relative">
                       <a [routerLink]="['/lesson', lesson.id, 'viewer']" class="px-5 py-4 flex items-start sm:items-center justify-between cursor-pointer w-full">
                         <div class="flex items-start sm:items-center space-x-4">
                              <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-sm" [ngClass]="isCompleted(lesson.id!) ? 'bg-emerald-500' : 'bg-indigo-600'">
                                @if (course()?.users?.avatar_url) {
                                  <img [src]="course()!.users!.avatar_url" class="w-full h-full object-cover opacity-90" [alt]="course()!.users!.firstname" />
                                } @else {
                                  <mat-icon class="text-white text-[20px]">{{ isCompleted(lesson.id!) ? 'check_circle' : 'menu_book' }}</mat-icon>
                                }
                             </div>
                            <div>
                               <h4 class="text-slate-800 font-medium text-[15px] group-hover:underline leading-tight pr-10" [class.text-slate-500]="isCompleted(lesson.id!)">
                                 Um novo material foi postado: {{ lesson.title }}
                               </h4>
                               <p class="text-slate-500 text-[13px] mt-1">{{ lesson.created_at | date:'dd/MM/yyyy' }}</p>
                            </div>
                         </div>
                       </a>
                       
                       <!-- Options Menu -->
                       <div class="absolute right-4 top-4 z-10">
                          <button aria-label="Opções da aula" (click)="$event.preventDefault(); $event.stopPropagation(); toggleLessonMenu(lesson.id!)" class="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors shrink-0">
                             <mat-icon>more_vert</mat-icon>
                          </button>
                          @if (activeLessonMenu() === lesson.id) {
                            <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 py-1 origin-top-right">
                              @if (appUser()?.role === 'admin') {
                                 <button (click)="$event.stopPropagation(); renameLesson(lesson)" class="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm flex items-center">
                                    <mat-icon class="mr-2 text-[18px]">edit</mat-icon> Editar Nome
                                 </button>
                                 <button  (click)="$event.stopPropagation(); deleteLesson(lesson.id!)" class="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-red-600 dark:text-red-400 text-sm flex items-center">
                                    <mat-icon class="mr-2 text-[18px]">delete</mat-icon> Excluir
                                 </button>
                              } @else {
                                 <button (click)="$event.stopPropagation(); activeLessonMenu.set(null)" class="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm flex items-center">
                                    <mat-icon class="mr-2 text-[18px]">close</mat-icon> Fechar Menu
                                 </button>
                              }
                            </div>
                            <div class="fixed inset-0 z-40 cursor-default" (click)="$event.stopPropagation(); activeLessonMenu.set(null)" (keyup.enter)="$event.stopPropagation(); activeLessonMenu.set(null)" tabindex="0"></div>
                          }
                       </div>
                     </div>
                   </div>
                 </div>
              }
            </div>
            
            @if (lessons().length === 0 && !course()!.link_drive && appUser()?.role !== 'admin') {
               <div class="text-center py-20 bg-transparent border border-slate-200 border-dashed rounded-xl">
                 <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                   <mat-icon class="text-slate-400">inbox</mat-icon>
                 </div>
                 <p class="text-slate-500 text-sm">Nenhum material foi postado ainda.</p>
               </div>
            }

          </div>
        </div>
      }
    </div>
  `
})
export class ClassPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);
  private supabase = inject(SupabaseService);
  private dialog = inject(DialogService);
  private toast = inject(ToastService);
  private enrollmentService = inject(EnrollmentService);
  private progressService = inject(ProgressService);
  private platformId = inject(PLATFORM_ID);

  course = signal<Course | null>(null);
  lessons = signal<Lesson[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<boolean>(false);
  private lessonsChannel: RealtimeChannel | null = null;
  appUser = this.supabase.appUser;

  hasLessons = computed(() => this.lessons().length > 0);
  activeLessonMenu = signal<string | null>(null);
  activeLegacyMenu = signal<boolean>(false);

  isEnrolled = signal<boolean>(false);
  completedLessonsCount = computed(() => {
    let count = 0;
    const ids = this.progressService.completedIds();
    for (const lesson of this.lessons()) {
      if (lesson.id && ids.has(lesson.id)) count++;
    }
    return count;
  });
  progressPercentage = computed(() => {
    const total = this.lessons().length;
    if (total === 0) return 0;
    return Math.round((this.completedLessonsCount() / total) * 100);
  });

  isCompleted(lessonId: string): boolean {
    return this.progressService.isCompleted(lessonId);
  }

  async enroll() {
    if (!this.course()) return;
    try {
      await this.enrollmentService.enroll(this.course()!.id);
      this.isEnrolled.set(true);
      this.toast.success('Inscrição realizada com sucesso!');
    } catch (e) {
      console.error(e);
      this.toast.error('Erro ao realizar inscrição.');
    }
  }

  async unenroll() {
    if (!this.course()) return;
    try {
      await this.enrollmentService.unenroll(this.course()!.id);
      this.isEnrolled.set(false);
      this.toast.info('Inscrição cancelada.');
    } catch (e) {
      console.error(e);
      this.toast.error('Erro ao cancelar inscrição.');
    }
  }

  toggleLessonMenu(id: string) {
    this.activeLessonMenu.update(v => v === id ? null : id);
  }

  toggleLegacyMenu() {
    this.activeLegacyMenu.update(v => !v);
  }

  async editLegacy() {
    this.activeLegacyMenu.set(false);
    const newLink = await this.dialog.prompt({
      title: 'Editar link do material',
      message: 'Digite o novo link para o material principal:',
      inputDefault: this.course()?.link_drive || '',
      inputPlaceholder: 'https://...',
      confirmLabel: 'Salvar'
    });
    if (newLink && newLink.trim() !== '' && newLink !== this.course()?.link_drive) {
      try {
        await this.courseService.updateCourseLink(this.course()!.id, newLink.trim());
        this.course.update(c => c ? { ...c, link_drive: newLink.trim() } : null);
      } catch (e) {
        console.error(e);
        await this.dialog.alert({ title: 'Erro', message: 'Erro ao editar material principal', danger: true });
      }
    }
  }

  async deleteLegacy() {
    this.activeLegacyMenu.set(false);
    const confirmed = await this.dialog.confirm({
      title: 'Remover material principal',
      message: 'Tem certeza que deseja remover o material principal?',
      danger: true,
      confirmLabel: 'Remover'
    });
    if (!confirmed) return;
    try {
      await this.courseService.updateCourseLink(this.course()!.id, '');
      this.course.update(c => c ? { ...c, link_drive: '' } : null);
    } catch (e) {
      console.error(e);
      await this.dialog.alert({ title: 'Erro', message: 'Erro ao remover material', danger: true });
    }
  }

  async deleteLesson(id: string) {
    this.activeLessonMenu.set(null);
    const confirmed = await this.dialog.confirm({
      title: 'Apagar material',
      message: 'Tem certeza que deseja apagar este material?',
      danger: true,
      confirmLabel: 'Apagar'
    });
    if (!confirmed) return;
    try {
       await this.courseService.deleteLesson(id);
       this.lessons.update(list => list.filter(l => l.id !== id));
    } catch (e: unknown) {
       const errorMsg = e instanceof Error ? e.message : JSON.stringify(e);
       console.error("Erro ao apagar material", e);
       await this.dialog.alert({ title: 'Erro', message: 'Erro ao apagar material: ' + errorMsg, danger: true });
    }
  }

  async renameLesson(lesson: Lesson) {
    this.activeLessonMenu.set(null);
    const newTitle = await this.dialog.prompt({
      title: 'Renomear material',
      message: 'Digite o novo nome para o material:',
      inputDefault: lesson.title,
      inputPlaceholder: 'Nome do material',
      confirmLabel: 'Renomear'
    });
    if (newTitle && newTitle.trim() !== '' && newTitle !== lesson.title) {
       try {
          await this.courseService.updateLessonTitle(lesson.id!, newTitle.trim());
          this.lessons.update(list => list.map(l => l.id === lesson.id ? {...l, title: newTitle.trim() } : l));
       } catch (e) {
          console.error("Erro ao renomear material", e);
          await this.dialog.alert({ title: 'Erro', message: 'Erro ao renomear material', danger: true });
       }
    }
  }

  async editAnnouncement() {
    const current = this.course()?.announcement || '';
    const newAnnouncement = await this.dialog.prompt({
      title: current ? 'Editar Comunicado' : 'Adicionar Comunicado',
      message: 'Digite o texto para destacar no topo da turma:',
      inputDefault: current,
      inputPlaceholder: 'Ex: Amanhã aula extra no laboratório!',
      confirmLabel: 'Publicar'
    });

    if (newAnnouncement !== null && newAnnouncement !== undefined && (newAnnouncement as any) !== false) {
      try {
        const val = (newAnnouncement as string).trim() === '' ? null : (newAnnouncement as string).trim();
        await this.courseService.updateCourseAnnouncement(this.course()!.id, val);
        this.course.update(c => c ? { ...c, announcement: val } : null);
        this.toast.success(val ? 'Mural atualizado!' : 'Aviso removido!');
      } catch (e) {
        console.error(e);
        await this.dialog.alert({ title: 'Erro', message: 'Não foi possível atualizar o comunicado.', danger: true });
      }
    }
  }

  async removeAnnouncement() {
    const confirmed = await this.dialog.confirm({
      title: 'Remover comunicado',
      message: 'Deseja remover o aviso do topo permanentemente?',
      confirmLabel: 'Remover',
      danger: true
    });

    if (confirmed) {
      try {
        await this.courseService.updateCourseAnnouncement(this.course()!.id, null);
        this.course.update(c => c ? { ...c, announcement: null } : null);
        this.toast.success('Aviso excluído!');
      } catch (e) {
        console.error(e);
        await this.dialog.alert({ title: 'Erro', message: 'Erro ao excluir comunicado.', danger: true });
      }
    }
  }

  async drop(event: CdkDragDrop<Lesson[]>) {
    if (this.appUser()?.role !== 'admin') return;
    if (event.previousIndex === event.currentIndex) return;

    // Snapshot original para reverter se falhar
    const previousLessons = [...this.lessons()];
    
    // Atualização otimista local
    const currentLessons = [...this.lessons()];
    moveItemInArray(currentLessons, event.previousIndex, event.currentIndex);
    this.lessons.set(currentLessons);

    // Calcular as novas posições
    const updates = currentLessons.map((lesson, index) => ({
      id: lesson.id!,
      order: index + 1
    }));

    try {
      await this.courseService.updateLessonOrders(updates);
      this.toast.success('Ordem das aulas atualizada com sucesso!');
    } catch (e) {
      console.error("Erro ao reordenar aulas:", e);
      this.toast.error('Erro ao salvar nova ordem no servidor. Revertendo...');
      this.lessons.set(previousLessons);
    }
  }

  ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const id = params.get('id');
      if (id) {
        let loadingTimeout = null;
        if (!this.course()) {
          loadingTimeout = setTimeout(() => this.isLoading.set(true), 200);
        }
        this.error.set(false);
        try {
          const [courseData, isEnrolled] = await Promise.all([
            this.courseService.getCourse(id),
            this.enrollmentService.isEnrolled(id)
          ]);
          this.isEnrolled.set(isEnrolled);
          
          if (courseData) {
             const lessons = await this.courseService.getLessons(id);
             this.lessons.set(lessons);
             await this.progressService.loadProgress(id);

             // Save last visual view timestamp to localStorage to clear new material flags [Item 5]
             if (isPlatformBrowser(this.platformId)) {
               localStorage.setItem(`sima_course_last_viewed_${id}`, new Date().toISOString());
             }

             // Subscrição real-time para esta turma específica
             this.lessonsChannel = this.supabase.client
               .channel(`public:lessons_${id}`)
               .on('postgres_changes', {
                 event: '*',
                 schema: 'public',
                 table: 'lessons',
                 filter: `course_id=eq.${id}`
               }, async () => {
                 // Recarrega as aulas do servidor furando o cache
                 const updatedLessons = await this.courseService.getLessons(id, true);
                 this.lessons.set(updatedLessons);
               })
               .subscribe();
          }
          
          if (loadingTimeout) clearTimeout(loadingTimeout);
          this.isLoading.set(false);
          this.course.set(courseData);
          if (!courseData) {
            this.error.set(true);
          }
        } catch (e) {
          console.error(e);
          this.error.set(true);
        } finally {
          this.isLoading.set(false);
        }
      } else {
        this.isLoading.set(false);
        this.error.set(true);
      }
    });
  }

  ngOnDestroy() {
    if (this.lessonsChannel) {
      this.supabase.client.removeChannel(this.lessonsChannel);
      this.lessonsChannel = null;
    }
  }
}
