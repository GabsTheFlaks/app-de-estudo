import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SafeResourceUrl } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CourseService } from '../../core/services/course.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { EmbedUrlService } from '../../shared/utils/embed-url.service';
import { Lesson, Comment } from '../../core/models/interfaces';
import { RealtimeChannel } from '@supabase/supabase-js';
import { DialogService } from '../../shared/components/dialog/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { ProgressService } from '../../core/services/progress.service';

@Component({
  selector: 'app-lesson-viewer-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, ReactiveFormsModule, FormsModule, DatePipe],
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
              <div 
                [class.fixed]="isCinemaMode()" 
                [class.inset-0]="isCinemaMode()" 
                [class.z-[100]]="isCinemaMode()" 
                [class.bg-black]="isCinemaMode()"
                [class.rounded-xl]="!isCinemaMode()"
                [class.aspect-video]="!isCinemaMode()"
                [class.h-screen]="isCinemaMode()"
                [class.w-screen]="isCinemaMode()"
                class="overflow-hidden shadow-sm relative border border-slate-200 dark:border-slate-800 bg-slate-900 transition-all duration-300"
              >
                <!-- Cinema Header Controller -->
                @if (isCinemaMode()) {
                  <div class="absolute top-4 left-4 z-[101] bg-black/70 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-white border border-white/10 shadow-lg animate-fade-in">
                    <button (click)="toggleCinemaMode()" class="flex items-center text-white hover:text-indigo-400 transition-colors border-none bg-transparent cursor-pointer">
                      <mat-icon class="text-[20px]">close</mat-icon>
                      <span class="ml-1 text-xs font-medium">Sair do Cinema</span>
                    </button>
                    <div class="h-4 w-px bg-white/20 mx-1"></div>
                    <span class="text-xs font-semibold truncate max-w-[200px] sm:max-w-[400px]">{{ lesson()!.title }}</span>
                  </div>
                }
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
                  <button (click)="toggleCompletion()" class="flex items-center gap-1.5 text-sm font-medium transition-colors bg-white dark:bg-slate-800 border px-3 py-1.5 rounded-full shadow-sm" [ngClass]="isCompleted() ? 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800'">
                    <mat-icon class="text-[18px] w-[18px] h-[18px]">{{ isCompleted() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon> {{ isCompleted() ? 'Concluída' : 'Marcar como Concluída' }}
                  </button>
                  @if (!isYouTube()) {
                    <button (click)="toggleCinemaMode()" class="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full hover:border-indigo-200 dark:hover:border-indigo-800 shadow-sm">
                      <mat-icon class="text-[18px] w-[18px] h-[18px]">fullscreen</mat-icon> Modo Cinema
                    </button>
                  }
                  <button (click)="reportProblem()" class="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full hover:border-rose-200 dark:hover:border-rose-800 shadow-sm">
                    <mat-icon class="text-[18px] w-[18px] h-[18px]">report_problem</mat-icon> Reportar
                  </button>
                </div>
                <!-- Divider -->
                <div class="h-px w-full bg-slate-200 dark:bg-slate-700 my-2"></div>
                <p class="text-slate-600 dark:text-slate-400 leading-relaxed text-sm lg:text-base whitespace-pre-wrap py-2">{{ lesson()!.description || 'Uma explicação detalhada sobre este conteúdo.' }}</p>
                
                <!-- Componente de Avaliação 5 Estrelas -->
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
                        [ngClass]="(hoverRating() || userRating() || 0) >= star ? 'text-amber-400 dark:text-amber-300' : 'text-slate-300 dark:text-slate-600'"
                      >
                        <mat-icon class="text-[26px] w-[26px] h-[26px] flex items-center justify-center">
                          {{ (hoverRating() || userRating() || 0) >= star ? 'star' : 'star_border' }}
                        </mat-icon>
                      </button>
                    }
                    @if (userRating()) {
                      <span class="text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full ml-2 animate-pulse">Avaliado!</span>
                    }
                  </div>
                </div>
                <!-- Múltiplos Anexos / Materiais de Apoio -->
                @if (attachments().length > 0) {
                  <div class="mt-6 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-sm animate-fade-in">
                    <div class="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700/50 flex items-center gap-2">
                      <mat-icon class="text-indigo-600 dark:text-indigo-400 text-[20px]">library_books</mat-icon>
                      <h3 class="font-bold text-slate-800 dark:text-slate-200 text-sm">Materiais de Apoio</h3>
                      <span class="ml-auto bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-full">{{ attachments().length }}</span>
                    </div>
                    <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-slate-900">
                      @for (att of attachments(); track att.id) {
                        <a [href]="att.url" target="_blank" class="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                           <div class="w-10 h-10 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
                             <mat-icon>{{ getIconForType(att.file_type) }}</mat-icon>
                           </div>
                           <div class="flex-grow min-w-0">
                             <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{{ att.title }}</h4>
                             <p class="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">{{ att.file_type }}</p>
                           </div>
                           <mat-icon class="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</mat-icon>
                        </a>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Navegação Fluida (Aula Anterior / Próxima Aula) -->
              <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mt-2 shadow-sm">
                <div>
                  @if (hasPrevLesson()) {
                    <button (click)="goToLesson(prevLesson()!.id!)" class="flex items-center gap-2 py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-sm font-medium cursor-pointer bg-transparent">
                      <mat-icon class="text-[18px] w-[18px] h-[18px]">chevron_left</mat-icon>
                      <span>Anterior: {{ prevLesson()!.title | slice:0:20 }}{{ prevLesson()!.title.length > 20 ? '...' : '' }}</span>
                    </button>
                  } @else {
                    <div class="w-1 flex-shrink-0"></div>
                  }
                </div>
                <div>
                  @if (hasNextLesson()) {
                    <button (click)="goToLesson(nextLesson()!.id!)" class="flex items-center gap-2 py-2 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm text-sm font-medium cursor-pointer">
                      <span>Próxima: {{ nextLesson()!.title | slice:0:20 }}{{ nextLesson()!.title.length > 20 ? '...' : '' }}</span>
                      <mat-icon class="text-[18px] w-[18px] h-[18px]">chevron_right</mat-icon>
                    </button>
                  }
                </div>
              </div>

              <!-- Comments Section -->
              @defer (on viewport) {
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
                           <button (click)="loadMoreComments()" class="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline bg-transparent">
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
                               <button aria-label="Editar comentário" (click)="startEdit(comment)" class="text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center">
                                  Editar
                               </button>
                               <button aria-label="Excluir comentário" (click)="deleteComment(comment.id!)" class="text-[11px] font-medium text-slate-500 hover:text-red-500 flex items-center">
                                  Excluir
                               </button>
                            </div>
                          } @else if (appUser()?.role === 'admin' && comment.user_id !== appUser()?.id) {
                            <div class="flex items-center mt-1.5 ml-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                               <button aria-label="Excluir comentário como administrador" (click)="deleteComment(comment.id!)" class="text-[11px] font-medium text-slate-500 hover:text-red-500 flex items-center">
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
                          @if (embedService.getThumbnailUrl(item.link_drive)) {
                             <img [src]="embedService.getThumbnailUrl(item.link_drive)" alt="" class="w-full h-full object-cover">
                          } @else {
                             <div class="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-400">
                                <mat-icon>{{ embedService.getIconForFileType(item.file_type) }}</mat-icon>
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
export class LessonViewerPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private supabase = inject(SupabaseService);
  protected embedService = inject(EmbedUrlService);
  private fb = inject(FormBuilder);
  private dialog = inject(DialogService);
  private toast = inject(ToastService);
  private progressService = inject(ProgressService);

  constructor() {
    effect(() => {
      if (this.isCinemaMode()) {
        document.body.classList.add('cinema-mode');
      } else {
        document.body.classList.remove('cinema-mode');
      }
    });
  }

  appUser = this.supabase.appUser;
  
  lesson = signal<Lesson | null>(null);
  courseLessons = signal<Lesson[]>([]);

  // Navigation computed
  currentIndex = computed(() => {
    const currentId = this.lesson()?.id;
    return this.courseLessons().findIndex(l => l.id === currentId);
  });
  hasPrevLesson = computed(() => this.currentIndex() > 0);
  hasNextLesson = computed(() => this.currentIndex() < this.courseLessons().length - 1 && this.currentIndex() !== -1);
  prevLesson = computed(() => this.hasPrevLesson() ? this.courseLessons()[this.currentIndex() - 1] : null);
  nextLesson = computed(() => this.hasNextLesson() ? this.courseLessons()[this.currentIndex() + 1] : null);

  isYouTube = computed(() => {
    const link = this.lesson()?.link_drive;
    if (!link) return false;
    return link.includes('youtube.com') || link.includes('youtu.be');
  });

  // Cinema Mode & Ratings Signal
  isCinemaMode = signal<boolean>(false);
  userRating = signal<number | null>(null);
  hoverRating = signal<number>(0);
  isLoading = signal<boolean>(true);
  error = signal<boolean>(false);
  safeUrl = signal<SafeResourceUrl | null>(null);
  
  isSaved = signal(false);
  isCompleted = signal(false);
  attachments = signal<any[]>([]);

  getIconForType(type: string): string {
    switch (type) {
      case 'pdf': return 'picture_as_pdf';
      case 'xls': return 'grid_on';
      case 'docs': return 'description';
      case 'link': return 'link';
      default: return 'insert_drive_file';
    }
  }

  // Comments State
  comments = signal<Comment[]>([]);
  commentsLoading = signal<boolean>(false);
  commentsTotal = signal<number>(0);
  commentsOffset = signal<number>(0);
  commentsLimit = 10;
  hasMoreComments = computed(() => this.comments().length < this.commentsTotal());

  isPostingComment = signal<boolean>(false);
  editingCommentId = signal<string | null>(null);
  editCommentValue = '';

  // Realtime channel reference for proper cleanup
  private realtimeChannel: RealtimeChannel | null = null;

  commentForm = this.fb.nonNullable.group({
    content: ['', [Validators.required, Validators.maxLength(1000)]]
  });

  // Keyboard shortcuts: ← previous lesson, → next lesson
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // Don't trigger when typing in textarea/input
    const tag = (event.target as HTMLElement).tagName.toLowerCase();
    if (tag === 'textarea' || tag === 'input') return;

    const lessons = this.courseLessons();
    const currentId = this.lesson()?.id;
    const currentIndex = lessons.findIndex(l => l.id === currentId);

    if (event.key === 'Escape' && this.isCinemaMode()) {
      this.isCinemaMode.set(false);
    }

    if (event.key === 'ArrowRight' && currentIndex < lessons.length - 1) {
      this.goToLesson(lessons[currentIndex + 1].id!);
    } else if (event.key === 'ArrowLeft' && currentIndex > 0) {
      this.goToLesson(lessons[currentIndex - 1].id!);
    }
  }

  ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const id = params.get('id');
      if (id) {
        this.isLoading.set(true);
        this.error.set(false);
        try {
          const lessonData = await this.courseService.getLesson(id);
          this.checkIfSaved(id);

          if (lessonData?.course_id) {
            await this.progressService.loadProgress(lessonData.course_id);
          }
          
          this.lesson.set(lessonData);
          
          if (lessonData?.link_drive) {
            this.safeUrl.set(this.embedService.getSafeEmbedUrl(lessonData.link_drive));
          } else {
            this.safeUrl.set(null);
          }
          
          // Busca lessons para sidebar
          if (lessonData?.course_id) {
             const lessons = await this.courseService.getLessons(lessonData.course_id);
             this.courseLessons.set(lessons);
          }
          
          this.isCompleted.set(this.progressService.isCompleted(id));
          

          // Pre-load attachments
          try {
            const atts = await this.courseService.getLessonAttachments(id);
            this.attachments.set(atts);
          } catch (e) {
            console.warn("Could not load attachments", e);
          }
          
          // Pre-load comments & ratings
          await this.loadUserRating(id);
          await this.loadComments(id);
          this.setupRealtime(id);
          
        } catch (e) {
          console.error(e);
          this.error.set(true);
        } finally {
          this.isLoading.set(false);
        }
      }
    });
  }

  setupRealtime(lessonId: string) {
    // Se já houver uma inscrição ativa da aula anterior, limpa para evitar duplicação e erro
    if (this.realtimeChannel) {
      try {
        this.supabase.client.removeChannel(this.realtimeChannel);
      } catch (e) {
        // Silencioso
      }
      this.realtimeChannel = null;
    }

    try {
      // Geramos um nome dinâmico com o ID da aula para o canal, evitando colisões em cache no Supabase
      this.realtimeChannel = this.supabase.client
        .channel(`comments_viewer_${lessonId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
           this.loadComments(lessonId);
        })
        .subscribe();
    } catch (err) {
      console.error('Não foi possível inscrever no realtime do fórum:', err);
    }
  }

  ngOnDestroy() {
    // Clean up global styles
    document.body.classList.remove('cinema-mode');
    
    // Fix memory leak: properly cleanup realtime channel
    if (this.realtimeChannel) {
      this.supabase.client.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  async reportProblem() {
    const desc = await this.dialog.prompt({
      title: 'Reportar Problema 🚨',
      message: 'O que há de errado com este material? (Ex: link quebrado, erro de áudio, desatualizado)',
      inputPlaceholder: 'Descreva brevemente o problema para os organizadores...',
      confirmLabel: 'Enviar Alerta'
    });

    if (desc && (desc as string).trim() !== '' && (desc as any) !== false) {
      try {
        await this.courseService.createAndonAlert(
          this.lesson()!.course_id,
          this.lesson()!.id!,
          (desc as string).trim()
        );
        this.toast.success('Alerta enviado ao administrador. Obrigado pelo feedback!');
      } catch (e) {
        console.error(e);
        this.toast.error('Erro ao enviar o alerta.');
      }
    }
  }

  goToLesson(id: string) {
    this.isCinemaMode.set(false); // Reset ao trocar de aula
    this.router.navigate(['/lesson', id, 'viewer']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleCinemaMode() {
    this.isCinemaMode.update(v => !v);
  }

  async loadUserRating(lessonId: string) {
    try {
      const rating = await this.courseService.getUserLessonRating(lessonId);
      this.userRating.set(rating);
    } catch (e) {
      console.error(e);
    }
  }

  async submitRating(rating: number) {
    if (!this.lesson()?.id) return;
    try {
      await this.courseService.saveLessonRating(this.lesson()!.id!, rating);
      this.userRating.set(rating);
      this.toast.success('Avaliação salva! Obrigado.');
    } catch (e) {
      console.error(e);
      this.toast.error('Erro ao salvar avaliação.');
    }
  }

  async loadComments(lessonId: string, reset = true) {
    if (reset) {
       this.commentsOffset.set(0);
       this.commentsLoading.set(true);
    }
    try {
       const offset = this.commentsOffset();
       const { data, count } = await this.courseService.getComments(lessonId, this.commentsLimit, offset);
       
       // Reverse to display chronologically (newest at bottom)
       const sorted = [...data].reverse();
       
       if (reset) {
         this.comments.set(sorted);
       } else {
         // Prepend older comments to the top
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
    this.loadComments(this.lesson()!.id!, false);
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
      
      // Update signal directly for instant feedback and increment total
      this.comments.update(c => [...c, newComment]);
      this.commentsTotal.update(t => t + 1);
    } catch (e) {
      console.error(e);
      await this.dialog.alert({ title: 'Erro', message: 'Erro ao enviar comentário. Tente novamente.', danger: true });
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
        console.error(e);
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
        await this.loadComments(this.lesson()!.id!);
     } catch (e) {
        console.error(e);
        await this.dialog.alert({ title: 'Erro', message: 'Erro ao editar comentário.', danger: true });
     }
  }

  goBack() {
    window.history.back();
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

  async toggleCompletion() {
    if (!this.lesson() || !this.appUser()) return;
    try {
      const id = this.lesson()!.id!;
      if (this.isCompleted()) {
        await this.progressService.markIncomplete(id);
        this.isCompleted.set(false);
      } else {
        await this.progressService.markComplete(id);
        this.isCompleted.set(true);
        this.toast.success('Aula concluída!');
      }
    } catch (e) {
      console.error(e);
      this.toast.error('Erro ao atualizar progresso.');
    }
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
      await navigator.clipboard.writeText(window.location.href);
      await this.dialog.alert({ title: 'Link copiado!', message: 'O link foi copiado para a área de transferência.' });
    }
  }
}
