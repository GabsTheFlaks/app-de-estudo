import { Component, input, signal, inject, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CourseService } from '../../../core/services/course.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { DialogService } from '../../../shared/components/dialog/dialog.service';
import { Comment, AppUser } from '../../../core/models/interfaces';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-lesson-comments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatIconModule, DatePipe],
  template: `
    <div class="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 mt-2 shadow-sm">
      <h3 class="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center">
        <mat-icon class="mr-2">chat</mat-icon>
        Comentários ({{commentsTotal()}})
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
          @if (hasMoreComments()) {
            <div class="flex justify-center mb-4">
                <button (click)="loadMoreComments()" class="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline bg-transparent border-none cursor-pointer">
                  Carregar comentários anteriores
                </button>
            </div>
          }
          @for (comment of comments(); track comment.id) {
            <div class="flex space-x-3 sm:space-x-4 group relative">
              <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-medium text-sm shrink-0 overflow-hidden">
                @if (comment.avatar_url) {
                  <img [src]="comment.avatar_url" alt="" class="w-full h-full object-cover">
                } @else {
                  {{ comment.user_name[0]?.toUpperCase() || 'U' }}
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
                          <button (click)="cancelEdit()" class="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent border-none cursor-pointer">Cancelar</button>
                          <button (click)="saveEdit(comment.id!)" class="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 border-none cursor-pointer">Salvar</button>
                      </div>
                    </div>
                } @else {
                    <p class="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap">{{ comment.content }}</p>
                }
              </div>

              <!-- Delete/Edit Actions -->
              @if (comment.user_id === currentUserId() && editingCommentId() !== comment.id) {
                <div class="flex items-center space-x-3 mt-1.5 ml-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button aria-label="Editar comentário" (click)="startEdit(comment)" class="text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center bg-transparent border-none cursor-pointer p-0">
                      Editar
                    </button>
                    <button aria-label="Excluir comentário" (click)="deleteComment(comment.id!)" class="text-[11px] font-medium text-slate-500 hover:text-red-500 flex items-center bg-transparent border-none cursor-pointer p-0">
                      Excluir
                    </button>
                </div>
              } @else if (appUser()?.role === 'admin' && comment.user_id !== currentUserId()) {
                <div class="flex items-center mt-1.5 ml-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button aria-label="Excluir comentário como administrador" (click)="deleteComment(comment.id!)" class="text-[11px] font-medium text-slate-500 hover:text-red-500 flex items-center bg-transparent border-none cursor-pointer p-0">
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
  `
})
export class LessonCommentsComponent implements OnInit, OnDestroy {
  lessonId = input.required<string>();
  currentUserId = input.required<string>();

  private courseService = inject(CourseService);
  private supabase = inject(SupabaseService);
  private fb = inject(FormBuilder);
  private dialog = inject(DialogService);

  appUser = this.supabase.appUser;

  // Comments State
  comments = signal<Comment[]>([]);
  commentsLoading = signal<boolean>(false);
  commentsTotal = signal<number>(0);
  commentsOffset = signal<number>(0);
  commentsLimit = 10;

  isPostingComment = signal<boolean>(false);
  editingCommentId = signal<string | null>(null);
  editCommentValue = '';

  commentForm = this.fb.nonNullable.group({
    content: ['', [Validators.required, Validators.maxLength(1000)]]
  });

  private realtimeChannel: RealtimeChannel | null = null;

  constructor() {
    // When lessonId changes, reload comments and setup new realtime channel
    effect(() => {
      const id = this.lessonId();
      if (id) {
        this.loadComments(id, true);
        this.setupRealtime(id);
      }
    });
  }

  ngOnInit() {}

  hasMoreComments() {
    return this.comments().length < this.commentsTotal();
  }

  async loadComments(lessonId: string, reset = true) {
    if (reset) {
       this.commentsOffset.set(0);
       this.commentsLoading.set(true);
    }
    try {
       const offset = this.commentsOffset();
       const { data, count } = await this.courseService.getComments(lessonId, this.commentsLimit, offset);

       const sorted = [...data].reverse();

       if (reset) {
         this.comments.set(sorted);
       } else {
         this.comments.update(c => [...sorted, ...c]);
       }

       if (count !== null) {
         this.commentsTotal.set(count);
       }
    } catch (e) {
       console.error(e);
    } finally {
       this.commentsLoading.set(false);
    }
  }

  loadMoreComments() {
    this.commentsOffset.update(o => o + this.commentsLimit);
    this.loadComments(this.lessonId(), false);
  }

  setupRealtime(lessonId: string) {
    // Cleanup obrigatório para evitar memory leaks!
    if (this.realtimeChannel) {
      try {
        this.supabase.client.removeChannel(this.realtimeChannel);
      } catch (e) {}
      this.realtimeChannel = null;
    }

    try {
      this.realtimeChannel = this.supabase.client
        .channel(`comments_viewer_${lessonId}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'comments',
            filter: `lesson_id=eq.${lessonId}`
        }, () => {
           this.loadComments(lessonId, true);
        })
        .subscribe();
    } catch (err) {
      console.error('Não foi possível inscrever no realtime do fórum:', err);
    }
  }

  ngOnDestroy() {
    // Cleanup final e absoluto
    if (this.realtimeChannel) {
      this.supabase.client.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  async onSubmitComment() {
    if (this.commentForm.invalid || !this.lessonId() || !this.appUser()) return;

    this.isPostingComment.set(true);
    try {
      const newComment = await this.courseService.addComment({
         lesson_id: this.lessonId(),
         user_id: this.appUser()!.id,
         user_name: `${this.appUser()!.firstname} ${this.appUser()!.lastname}`,
         avatar_url: this.appUser()!.avatar_url,
         content: this.commentForm.value.content!
      });
      this.commentForm.reset();

      this.comments.update(c => [...c, newComment]);
      this.commentsTotal.update(t => t + 1);
    } catch (e) {
      console.error(e);
      await this.dialog.alert({ title: 'Erro', message: 'Erro ao enviar comentário.', danger: true });
    } finally {
      this.isPostingComment.set(false);
    }
  }

  async deleteComment(id: string) {
     const confirmed = await this.dialog.confirm({
       title: 'Apagar comentário',
       message: 'Tem certeza que deseja apagar este comentário?',
       danger: true,
       confirmLabel: 'Apagar'
     });
     if (!confirmed) return;
      try {
         await this.courseService.deleteComment(id);
         this.comments.update(c => c.filter(comment => comment.id !== id));
         this.commentsTotal.update(t => Math.max(0, t - 1));
      } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : JSON.stringify(e);
        await this.dialog.alert({ title: 'Erro', message: 'Você não tem permissão: ' + errorMsg, danger: true });
     }
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
        await this.loadComments(this.lessonId(), true);
     } catch (e) {
        console.error(e);
        await this.dialog.alert({ title: 'Erro', message: 'Erro ao editar comentário.', danger: true });
     }
  }
}
