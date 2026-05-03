import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { Course, CourseService } from './course.service';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Role, FileType } from './enums';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { PromptDialogComponent } from './prompt-dialog.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatDialogModule],
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
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            @for (course of courses(); track course.id) {
              <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col group hover:shadow-md transition-shadow h-[300px] relative group cursor-pointer" [routerLink]="['/course', course.id]">

                <!-- Card Header with Background Image/Color -->
                <div class="h-[100px] w-full relative bg-indigo-600 p-4 flex flex-col justify-between overflow-hidden">
                   <!-- Background Image Overlay (if thumbnail exists) -->
                   @if (course.thumbnail_url) {
                      <div class="absolute inset-0 opacity-40 mix-blend-overlay">
                        <img [src]="course.thumbnail_url" alt="" class="block w-full h-full object-cover" />
                      </div>
                   }

                   <!-- Gradient overlay -->
                   <div class="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-black/40 to-transparent"></div>

                   <div class="relative z-10 w-full flex justify-between items-start">
                     <div class="flex-1 min-w-0 pr-2">
                       <h3 class="text-white font-medium text-[20px] leading-tight hover:underline truncate">{{ course.title }}</h3>
                       <span class="text-white/90 text-sm truncate block mt-1 hover:underline">{{ course.category || 'Sem Categoria' }}</span>
                     </div>
                   </div>
                </div>

                <!-- Teacher Avatar -->
                <div class="absolute right-4 top-[70px] z-20">
                    <div class="w-[70px] h-[70px] bg-indigo-500 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center shadow-sm text-3xl text-white font-normal overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                      {{ course.title?.[0]?.toUpperCase() || 'C' }}
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

                  @if (appUser()?.role === Role.ADMIN) {
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
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  private supabase = inject(SupabaseService);
  private courseService = inject(CourseService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  appUser = this.supabase.appUser;
  courses = signal<Course[]>([]);
  isLoading = signal<boolean>(true);
  activeCourseMenu = signal<string | null>(null);

  // Course Management State
  Role = Role;

  renamingCourseId = signal<string | null>(null);
  renamingValue = signal<string>('');

  async ngOnInit() {
    await this.fetchCourses();
  }

  async fetchCourses() {
    let loadingTimeout: ReturnType<typeof setTimeout> | null = null;
    try {
      if (this.courses().length === 0) {
        loadingTimeout = setTimeout(() => this.isLoading.set(true), 200);
      }
      const data = await this.courseService.getCourses();
      if (loadingTimeout) clearTimeout(loadingTimeout);
      this.isLoading.set(false);
      this.courses.set(data);
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
    switch (type) {
      case FileType.VIDEO: return 'play_circle';
      case FileType.PDF: return 'picture_as_pdf';
      case FileType.DOCS: return 'description';
      case FileType.PPTX: return 'slideshow';
      case FileType.XLS: return 'table_chart';
      default: return 'insert_drive_file';
    }
  }

  getBadgeClasses(type: string): string {
    if (type === FileType.VIDEO) return 'bg-emerald-500 text-slate-900';
    if (type === FileType.PDF) return 'bg-indigo-500 text-white';
    return 'bg-white/10 text-white border border-white/20 backdrop-blur-sm';
  }

  async logout() {
    await this.supabase.client.auth.signOut();
    this.router.navigate(['/login']);
  }

  async deleteCourse(id: string) {
    this.activeCourseMenu.set(null);
    if (this.appUser()?.role !== Role.ADMIN) {
      // Idealmente isto também seria um Dialog ou Snackbar em vez de alert,
      // mas vamos manter o foco na remoção do window.confirm
      alert('Apenas admins podem apagar turmas.');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar exclusão',
        message: 'Tem certeza que deseja apagar esta turma e todos os seus materiais?'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        try {
          await this.courseService.deleteCourse(id);
          await this.fetchCourses();
        } catch (err: any) {
          console.error("Erro ao deletar:", err);
          alert("Erro ao deletar a turma: " + (err?.message || JSON.stringify(err)));
        }
      }
    });
  }

  async renameCourse(course: Course) {
    this.activeCourseMenu.set(null);
    if (this.appUser()?.role !== Role.ADMIN) {
      alert('Apenas admins podem editar turmas.');
      return;
    }

    const dialogRef = this.dialog.open(PromptDialogComponent, {
      width: '400px',
      data: {
        title: 'Renomear turma',
        message: 'Digite o novo nome para a turma:',
        label: 'Nome da turma',
        initialValue: course.title
      }
    });

    dialogRef.afterClosed().subscribe(async (newTitle) => {
      if (newTitle && newTitle.trim() !== '' && newTitle !== course.title) {
         try {
           await this.courseService.updateCourseTitle(course.id, newTitle.trim());
           await this.fetchCourses();
         } catch(err) {
           console.error("Erro ao renomear:", err);
           alert("Erro ao renomear a turma.");
         }
      }
    });
  }

  openClassInfo(id: string) {
    this.router.navigate(['/course', id]);
  }

  openFolder(id: string) {
    // Navigates to a "folder/attachments" view - mock for now
    this.router.navigate(['/course', id, 'files']);
  }
}
