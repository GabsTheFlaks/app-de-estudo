import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CourseService, Course, Lesson } from './course.service';
import { SupabaseService } from './supabase.service';

@Component({
  selector: 'app-class-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, DatePipe],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
      @if (isLoading()) {
        <div class="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center h-[60vh]">
          <mat-icon class="animate-spin text-4xl mb-4 text-indigo-600">loop</mat-icon>
          <span>Carregando turma...</span>
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
          </div>
          
          <!-- Teacher Avatar (Placeholder) -->
          <div class="absolute top-6 right-6 z-20">
             <div class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-white shadow-sm">
               <mat-icon>school</mat-icon>
             </div>
          </div>
        </div>

        <div class="mt-6 flex flex-col lg:flex-row gap-6 relative items-start">
          <!-- Sidebar -->
          <div class="w-full lg:w-56 shrink-0 order-2 lg:order-1">
            <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <h3 class="font-medium text-sm text-slate-800 mb-4">Próximas atividades</h3>
              <p class="text-xs text-slate-500 mb-4">Nenhuma atividade para a próxima semana!</p>
              <div class="text-right">
                <a href="javascript:void(0)" class="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">Ver tudo</a>
              </div>
            </div>
          </div>
          
          <!-- Main Content (Stream) -->
          <div class="flex-1 space-y-4 w-full order-1 lg:order-2">
            
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
                    <button (click)="$event.preventDefault(); $event.stopPropagation(); toggleLegacyMenu()" class="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors shrink-0">
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
            @for (lesson of lessons(); track lesson.id) {
               <div class="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col hover:bg-slate-50 transition-colors group relative">
                 <a [routerLink]="['/lesson', lesson.id, 'viewer']" class="px-5 py-4 flex items-start sm:items-center justify-between cursor-pointer w-full">
                   <div class="flex items-start sm:items-center space-x-4">
                      <div class="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shrink-0">
                         <mat-icon>menu_book</mat-icon>
                      </div>
                      <div>
                         <h4 class="text-slate-800 font-medium text-[15px] group-hover:underline leading-tight">Um novo material foi postado: {{ lesson.title }}</h4>
                         <p class="text-slate-500 text-[13px] mt-1">{{ lesson.created_at | date:'dd/MM/yyyy' }}</p>
                      </div>
                   </div>
                 </a>
                 <div class="absolute right-4 top-4 z-10">
                    <button (click)="$event.preventDefault(); $event.stopPropagation(); toggleLessonMenu(lesson.id!)" class="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors shrink-0">
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
            }
            
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
export class ClassPage implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);
  private supabase = inject(SupabaseService);

  course = signal<Course | null>(null);
  lessons = signal<Lesson[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<boolean>(false);
  appUser = this.supabase.appUser;

  hasLessons = computed(() => this.lessons().length > 0);
  activeLessonMenu = signal<string | null>(null);
  activeLegacyMenu = signal<boolean>(false);

  toggleLessonMenu(id: string) {
    this.activeLessonMenu.update(v => v === id ? null : id);
  }

  toggleLegacyMenu() {
    this.activeLegacyMenu.update(v => !v);
  }

  async editLegacy() {
    this.activeLegacyMenu.set(false);
    const newLink = window.prompt("Digite o novo link para o material principal:", this.course()?.link_drive || '');
    if (newLink && newLink.trim() !== '' && newLink !== this.course()?.link_drive) {
      try {
        await this.courseService.updateCourseLink(this.course()!.id, newLink.trim());
        this.course.update(c => c ? { ...c, link_drive: newLink.trim() } : null);
      } catch (e) {
        console.error(e);
        alert("Erro ao editar material principal");
      }
    }
  }

  async deleteLegacy() {
    this.activeLegacyMenu.set(false);
    if (!confirm("Tem certeza que deseja remover o material principal?")) return;
    try {
      await this.courseService.updateCourseLink(this.course()!.id, '');
      this.course.update(c => c ? { ...c, link_drive: '' } : null);
    } catch (e) {
      console.error(e);
      alert("Erro ao remover material");
    }
  }

  async deleteLesson(id: string) {
    this.activeLessonMenu.set(null);
    if (!confirm("Tem certeza que deseja apagar este material?")) return;
    try {
       await this.courseService.deleteLesson(id);
       this.lessons.update(list => list.filter(l => l.id !== id));
    } catch (e: any) {
       console.error("Erro ao apagar material", e);
       alert("Erro ao apagar material: " + (e?.message || JSON.stringify(e)));
    }
  }

  async renameLesson(lesson: Lesson) {
    this.activeLessonMenu.set(null);
    const newTitle = window.prompt("Digite o novo nome para o material:", lesson.title);
    if (newTitle && newTitle.trim() !== '' && newTitle !== lesson.title) {
       try {
          await this.courseService.updateLessonTitle(lesson.id!, newTitle.trim());
          this.lessons.update(list => list.map(l => l.id === lesson.id ? {...l, title: newTitle.trim() } : l));
       } catch (e) {
          console.error("Erro ao renomear material", e);
          alert("Erro ao renomear material");
       }
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
          const [courseData, lessonsData] = await Promise.all([
            this.courseService.getCourse(id),
            this.courseService.getLessons(id)
          ]);
          if (loadingTimeout) clearTimeout(loadingTimeout);
          this.isLoading.set(false);
          this.course.set(courseData);
          this.lessons.set(lessonsData);
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
}
