import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CourseService, Lesson, Comment } from './course.service';
import { SupabaseService } from './supabase.service';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { Role } from './enums';

@Component({
  selector: 'app-lesson-viewer-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, ReactiveFormsModule, FormsModule, DatePipe, MatDialogModule],
  template: `
    <div class="h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto w-full">
      @if (isLoading()) {
        <div class="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center h-full">
          <mat-icon class="animate-spin text-4xl mb-4 text-indigo-600 dark:text-indigo-400">loop</mat-icon>
          <span>Carregando material...</span>
        </div>
      } @else if (error() || !lesson()) {
        <div class="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-8 text-center max-w-sm mx-auto h-full">
          <div class="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4">
            <mat-icon class="text-3xl">error_outline</mat-icon>
          </div>
          <h2 class="text-xl font-medium text-slate-800 dark:text-slate-100 mb-2">Conteúdo não encontrado</h2>
          <p class="mb-8 text-sm">A aula que você tentou acessar não existe ou houve um problema ao carregá-la.</p>
          <button (click)="goBack()" class="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all text-sm">
            <mat-icon class="mr-2 text-[20px]">arrow_back</mat-icon>
            Voltar para a Turma
          </button>
        </div>
      } @else {
        <div class="p-4 sm:p-5 max-w-[1400px] mx-auto min-h-full">
          <!-- Viewer Header -->
          <header class="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pt-2">
            <a [routerLink]="['/course', lesson()!.course_id]" class="bg-transparent border-none cursor-pointer flex items-center justify-center text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">
              <mat-icon class="text-[28px] w-7 h-7">arrow_back</mat-icon>
            </a>
            <h2 class="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100 truncate pr-4">{{ lesson()!.title }}</h2>
          </header>

          <div class="flex flex-col lg:grid lg:grid-cols-[1fr_350px] gap-6 items-start">
            <!-- Coluna Esquerda -->
            <div class="flex flex-col gap-6 w-full min-w-0">

              <!-- Viewer Iframe -->
              <div class="rounded-xl overflow-hidden shadow-sm relative aspect-video border border-slate-200 dark:border-slate-800 bg-slate-900">
                @if (safeUrl()) {
                  @defer (on viewport; prefetch on idle) {
                    <iframe
                      [src]="safeUrl()"
                      class="w-full h-full border-none absolute inset-0 bg-white"
                      allowfullscreen
                      loading="lazy"
                    ></iframe>
                  } @placeholder {
                    <div class="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-900">
                      <mat-icon class="animate-spin text-3xl mb-2 text-indigo-500">loop</mat-icon>
                      <span class="text-sm">Carregando player...</span>
                    </div>
                  }
                } @else {
                  <div class="absolute inset-0 flex items-center justify-center text-slate-500 bg-slate-50 dark:bg-slate-900">
                    <div class="text-center p-4">
                      <mat-icon class="text-4xl mb-2 text-slate-400">link_off</mat-icon>
                      <p class="text-sm">O link para este material não é suportado.</p>
                      <a [href]="lesson()?.link_drive" target="_blank" class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors inline-block text-sm font-medium">
                        Abrir Externamente
                      </a>
                    </div>
                  </div>
                }
              </div>

              <!-- Info Section -->
              <div class="flex flex-col px-1">
                <h1 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">{{ lesson()!.title }}</h1>
                <div class="flex items-center gap-4 mb-4 flex-wrap">
                  @if (lesson()?.link_drive) {
                    <a [href]="lesson()?.link_drive" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full hover:border-indigo-200 dark:hover:border-indigo-800 shadow-sm">
                      <mat-icon class="text-[18px] w-[18px] h-[18px]">open_in_new</mat-icon> Link Externo
                    </a>
                  }
                  <button (click)="shareLesson()" class="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full hover:border-indigo-200 dark:hover:border-indigo-800 shadow-sm">
                    <mat-icon class="text-[18px] w-[18px] h-[18px]">share</mat-icon> Compartilhar
                  </button>
                  <button (click)="toggleSave()" class="flex items-center gap-1.5 text-sm font-medium transition-colors bg-white dark:bg-slate-800 border px-3 py-1.5 rounded-full shadow-sm" [ngClass]="isSaved() ? 'text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800'">
                    <mat-icon class="text-[18px] w-[18px] h-[18px]">{{ isSaved() ? 'bookmark' : 'bookmark_border' }}</mat-icon> {{ isSaved() ? 'Salvo' : 'Salvar' }}
                  </button>
                </div>
                <!-- Divider -->
                <div class="h-px w-full bg-slate-200 dark:bg-slate-700 my-2"></div>
                <p class="text-slate-600 dark:text-slate-400 leading-relaxed text-sm lg:text-base whitespace-pre-wrap py-2">{{ lesson()!.description || 'Uma explicação detalhada sobre este conteúdo.' }}</p>
              </div>

              <!-- Comments Section -->
              @defer (on viewport) {
                <div class="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 mt-2 shadow-sm">
                  <h3 class="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center">
                    <mat-icon class="mr-2">chat</mat-icon>
                    Comentários ({{comments().length}})
                  </h3>

                  <!-- Comment Input -->
                  <form [formGroup]="commentForm" (ngSubmit)="onSubmitComment()" class="flex flex-col mb-8">
                    <textarea
                      formControlName="content"
                      rows="2"
                      placeholder="Adicione um comentário público..."
                      class="w-full text-sm p-4 bg-slate-50 dark:bg-slate-900/50 border-b-2 border-transparent hover:bg-slate-100 dark:hover:bg-slate-900 outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors resize-none text-slate-800 dark:text-slate-100 rounded-t-lg rounded-b-none"
                    ></textarea>
                    <div class="flex justify-end mt-2 border-t border-slate-200 dark:border-slate-700 pt-2">
                      <button
                        type="submit"
                        [disabled]="commentForm.invalid || isPostingComment()"
                        class="rounded-full bg-indigo-600 px-5 py-2 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                      >
                        @if (isPostingComment()) {
                          <mat-icon class="animate-spin mr-2 text-[18px] w-[18px] h-[18px]">loop</mat-icon> Enviando...
                        } @else {
                          Comentar
                        }
                      </button>
                    </div>
                  </form>

                  <!-- Comment List -->
                  @if (commentsLoading()) {
                    <div class="flex justify-center py-4">
                      <mat-icon class="animate-spin text-slate-400">loop</mat-icon>
                    </div>
                  } @else if (comments().length === 0) {
                    <div class="text-center py-8 text-slate-500 dark:text-slate-400">
                      Nenhum comentário ainda. Seja o primeiro a comentar!
                    </div>
                  } @else {
                    <div class="space-y-6">
                      @for (comment of comments(); track comment.id) {
                        <div class="flex space-x-3 sm:space-x-4 group relative">
                          <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-medium text-sm shrink-0 overflow-hidden">
                            @if (comment.avatar_url) {
                              <img [src]="comment.avatar_url" alt="" class="w-full h-full object-cover">
                            } @else {
                              {{ comment.user_name?.[0]?.toUpperCase() || 'U' }}
                            }
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl rounded-tl-none border border-slate-100 dark:border-slate-700/50">
                              <div class="flex items-center justify-between mb-1">
                                <span class="font-medium text-slate-800 dark:text-slate-200 text-sm truncate pr-2">{{ comment.user_name }}</span>
                                <span class="text-[11px] text-slate-400 shrink-0">{{ comment.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                              </div>

                              @if (editingCommentId() === comment.id) {
                                <div class="mt-2">
                                    <textarea
                                      [(ngModel)]="editCommentValue"
                                      class="w-full text-sm p-3 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500"
                                    rows="2"
                                  ></textarea>
                                  <div class="flex justify-end space-x-2 mt-2">
                                     <button (click)="cancelEdit()" class="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">Cancelar</button>
                                     <button (click)="saveEdit(comment.id!)" class="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700">Salvar</button>
                                  </div>
                               </div>
                            } @else {
                               <p class="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap">{{ comment.content }}</p>
                            }
                          </div>

                          <!-- Delete/Edit Actions -->
                          @if (comment.user_id === appUser()?.id && editingCommentId() !== comment.id) {
                            <div class="flex items-center space-x-3 mt-1.5 ml-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                               <button (click)="startEdit(comment)" class="text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center">
                                  Editar
                               </button>
                               <button (click)="deleteComment(comment.id!)" class="text-[11px] font-medium text-slate-500 hover:text-red-500 flex items-center">
                                  Excluir
                               </button>
                            </div>
                          } @else if (appUser()?.role === Role.ADMIN && comment.user_id !== appUser()?.id) {
                            <div class="flex items-center mt-1.5 ml-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                               <button (click)="deleteComment(comment.id!)" class="text-[11px] font-medium text-slate-500 hover:text-red-500 flex items-center">
                                  Excluir como Admin
                               </button>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
                </div>
              } @placeholder {
                <div class="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 mt-2 shadow-sm min-h-[150px] flex items-center justify-center text-slate-400">
                  <mat-icon class="animate-spin text-2xl mr-2">loop</mat-icon> <span class="text-sm">Carregando comentários...</span>
                </div>
              }
            </div>

            <!-- Sidebar Direita -->
            <aside class="sidebar relative w-full lg:sticky lg:top-6 lg:self-start lg:h-[calc(100vh-8rem)]">
              <h3 class="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-3 px-1 uppercase tracking-widest pl-1">Próximos Conteúdos</h3>
              <div class="flex flex-col gap-2 overflow-y-auto pr-1 pb-10 max-h-full">
                @for (item of courseLessons(); track item.id; let i = $index) {
                   <button class="flex items-start gap-3 p-2.5 rounded-xl text-left transition-colors border group bg-transparent w-full"
                           [class.border-indigo-200]="item.id === lesson()?.id"
                           [class.bg-indigo-50]="item.id === lesson()?.id"
                           [class.dark:bg-indigo-900/20]="item.id === lesson()?.id"
                           [class.dark:border-indigo-800]="item.id === lesson()?.id"
                           [class.border-transparent]="item.id !== lesson()?.id"
                           [class.hover:bg-white]="item.id !== lesson()?.id"
                           [class.dark:hover:bg-slate-800]="item.id !== lesson()?.id"
                           [class.hover:border-slate-200]="item.id !== lesson()?.id"
                           [class.dark:hover:border-slate-700]="item.id !== lesson()?.id"
                           (click)="goToLesson(item.id!)">

                       <div class="relative w-[110px] min-w-[110px] h-[62px] rounded border border-slate-200/50 dark:border-slate-700 overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 shadow-sm">
                          @if (getThumbnailUrl(item.link_drive)) {
                             <img [src]="getThumbnailUrl(item.link_drive)" alt="" class="w-full h-full object-cover">
                          } @else if (item.link_drive && getThumbnailUrl(item.link_drive) === '') {
                             <!-- Valid url, but no thumb available. Show Icon. -->
                             <div class="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                                <mat-icon>{{ getIconType(item.file_type) }}</mat-icon>
                             </div>
                          } @else {
                             <div class="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-400">
                                <mat-icon>{{ getIconType(item.file_type) }}</mat-icon>
                             </div>
                          }
                          <span class="absolute bottom-1 right-1 text-[9px] bg-black/70 text-white font-medium px-1.5 py-0.5 rounded backdrop-blur-sm shadow-sm">{{item.file_type | uppercase}}</span>
                       </div>

                       <div class="flex flex-col gap-0.5 pt-0.5 min-w-0 flex-1">
                         <span class="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" [class.text-indigo-700]="item.id === lesson()?.id" [class.dark:text-indigo-300]="item.id === lesson()?.id">{{item.title}}</span>
                         <span class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 truncate mt-0.5">{{item.description || 'Aula'}}</span>
                       </div>
                   </button>
                }

                @if (courseLessons().length === 0 && !isLoading()) {
                   <div class="text-sm text-slate-500 text-center py-6 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 border-dashed dark:border-slate-700">
                      Nenhum outro conteúdo.
                   </div>
                }
              </div>
            </aside>
          </div>
        </div>
      }
    </div>
  `
})
export class LessonViewerPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private supabase = inject(SupabaseService);
  private sanitizer = inject(DomSanitizer);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  appUser = this.supabase.appUser;
  Role = Role;

  lesson = signal<Lesson | null>(null);
  courseLessons = signal<Lesson[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<boolean>(false);
  safeUrl = signal<SafeResourceUrl | null>(null);

  isSaved = signal<boolean>(false);

  // Comments State
  comments = signal<Comment[]>([]);
  commentsLoading = signal<boolean>(false);
  isPostingComment = signal<boolean>(false);
  editingCommentId = signal<string | null>(null);
  editCommentValue = '';

  commentForm = this.fb.nonNullable.group({
    content: ['', [Validators.required, Validators.maxLength(1000)]]
  });

  ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const id = params.get('id');
      if (id) {
        const loadingTimeout = setTimeout(() => this.isLoading.set(true), 200);
        this.error.set(false);
        try {
          // Pre-carrega o lesson
          const data = await this.courseService.getLesson(id);
          clearTimeout(loadingTimeout);
          this.isLoading.set(false);
          this.lesson.set(data);

          if (data?.link_drive) {
            let embedUrl = data.link_drive;

            // Format YouTube/Drive URL identical to ViewerPage logic
            if (embedUrl.includes('youtube.com/watch?v=')) {
               embedUrl = embedUrl.replace('watch?v=', 'embed/');
               const ampersandPos = embedUrl.indexOf('&');
               if(ampersandPos !== -1) {
                 embedUrl = embedUrl.substring(0, ampersandPos);
               }
            } else if (embedUrl.includes('youtu.be/')) {
               embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
               const qPos = embedUrl.indexOf('?');
               if(qPos !== -1) {
                 embedUrl = embedUrl.substring(0, qPos);
               }
            } else if (embedUrl.includes('drive.google.com') && embedUrl.includes('/view')) {
               embedUrl = embedUrl.replace('/view', '/preview');
               const qPos = embedUrl.indexOf('?');
               if(qPos !== -1) {
                 embedUrl = embedUrl.substring(0, qPos);
               }
            }

            this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl));
          } else {
            this.safeUrl.set(null);
          }

          // Busca lessons para sidebar
          if (data?.course_id) {
             const lessons = await this.courseService.getLessons(data.course_id);
             this.courseLessons.set(lessons);
          }

          // Pre-load comments
          this.loadComments(id);
          this.checkIfSaved(id);

        } catch (e) {
          console.error(e);
          this.error.set(true);
        } finally {
          // ensure isLoading is false if error occurred
          this.isLoading.set(false);
        }
      }
    });

    this.supabase.client
      .channel('public:comments_viewer')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
         const currentLesson = this.lesson();
         if (currentLesson) {
            this.loadComments(currentLesson.id!);
         }
      })
      .subscribe();
  }

  getThumbnailUrl(url: string | null | undefined): string {
    if (!url) return '';
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1].split('?')[0];
        } else {
          const urlObj = new URL(url);
          videoId = urlObj.searchParams.get('v') || '';
        }
        if (videoId) return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      } else if (url.includes('drive.google.com')) {
         let driveId = '';
         if (url.includes('/d/')) {
           driveId = url.split('/d/')[1].split('/')[0];
         } else {
           const urlObj = new URL(url);
           driveId = urlObj.searchParams.get('id') || '';
         }
         if (driveId) return `https://drive.google.com/thumbnail?id=${driveId}&sz=w240`;
      }
    } catch(e) {
      console.warn('URL thumbnail parse erro', e);
    }
    return '';
  }

  goToLesson(id: string) {
    this.router.navigate(['/lesson', id, 'viewer']);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top when navigating
  }

  async loadComments(lessonId: string) {
    this.commentsLoading.set(true);
    try {
       const data = await this.courseService.getComments(lessonId);
       this.comments.set(data);
    } catch (e) {
       console.error(e);
    } finally {
       this.commentsLoading.set(false);
    }
  }

  async onSubmitComment() {
    if (this.commentForm.invalid || !this.lesson()?.id || !this.appUser()) return;

    this.isPostingComment.set(true);
    try {
      const newComment = await this.courseService.addComment({
         lesson_id: this.lesson()!.id!,
         user_id: this.appUser()!.id,
         user_name: `${this.appUser()!.firstname} ${this.appUser()!.lastname}`,
         avatar_url: this.appUser()!.avatar_url,
         content: this.commentForm.value.content!
      });
      this.commentForm.reset();

      // Update signal directly for instant feedback (no delay!)
      this.comments.update(c => [...c, newComment]);
    } catch (e) {
      console.error(e);
      alert('Erro ao enviar comentário.');
    } finally {
      this.isPostingComment.set(false);
    }
  }

  async deleteComment(id: string) {
     const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
           title: 'Excluir Comentário',
           message: 'Tem certeza que deseja apagar este comentário?'
        }
     });

     dialogRef.afterClosed().subscribe(async (confirmed) => {
        if (!confirmed) return;
        try {
           await this.courseService.deleteComment(id);
           await this.loadComments(this.lesson()!.id!);
        } catch (e: any) {
           console.error(e);
           alert('Erro ao apagar. Você não tem permissão: ' + (e?.message || JSON.stringify(e)));
        }
     });
  }

  startEdit(comment: Comment) {
     this.editingCommentId.set(comment.id!);
     this.editCommentValue = comment.content;
  }

  cancelEdit() {
     this.editingCommentId.set(null);
     this.editCommentValue = '';
  }

  async saveEdit(id: string) {
     if(!this.editCommentValue.trim()) return;
     try {
        await this.courseService.updateComment(id, this.editCommentValue.trim());
        this.editingCommentId.set(null);
        await this.loadComments(this.lesson()!.id!);
     } catch (e) {
        console.error(e);
        alert('Erro ao editar comentário.');
     }
  }

  goBack() {
    window.history.back();
  }

  getIconType(type: string | undefined): string {
    switch (type) {
      case 'video': return 'play_circle';
      case 'pdf': return 'picture_as_pdf';
      case 'doc': return 'description';
      case 'link': return 'link';
      default: return 'insert_drive_file';
    }
  }

  checkIfSaved(lessonId: string) {
    const savedList = JSON.parse(localStorage.getItem('saved_lessons') || '[]');
    this.isSaved.set(savedList.includes(lessonId));
  }

  toggleSave() {
    const lessonId = this.lesson()?.id;
    if (!lessonId) return;

    let savedList: string[] = JSON.parse(localStorage.getItem('saved_lessons') || '[]');
    if (savedList.includes(lessonId)) {
      savedList = savedList.filter(id => id !== lessonId);
      this.isSaved.set(false);
    } else {
      savedList.push(lessonId);
      this.isSaved.set(true);
    }
    localStorage.setItem('saved_lessons', JSON.stringify(savedList));
  }

  async shareLesson() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: this.lesson()?.title || 'Aula Acadêmica',
          text: `Confira este material: ${this.lesson()?.title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Erro ao compartilhar', error);
      }
    } else {
      // Fallback
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  }
}
