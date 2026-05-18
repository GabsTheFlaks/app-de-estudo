import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener, effect, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SafeResourceUrl } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { CourseService } from '../../core/services/course.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { EmbedUrlService } from '../../shared/utils/embed-url.service';
import { Lesson } from '../../core/models/interfaces';
import { DialogService } from '../../shared/components/dialog/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { ProgressService } from '../../core/services/progress.service';
import { LessonRatingComponent } from './components/lesson-rating.component';
import { LessonCommentsComponent } from './components/lesson-comments.component';
import { StudyToolsService } from '../../core/services/study-tools.service';

@Component({
  selector: 'app-lesson-viewer-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, LessonRatingComponent, LessonCommentsComponent],
  template: `
    <div class="h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto w-full animate-fade-in">
      @if (isLoading()) {
        <div class="flex-grow flex flex-col items-center justify-center text-slate-400 p-8 text-center h-96">
          <mat-icon class="animate-spin text-4xl mb-4 text-indigo-600 dark:text-indigo-400">loop</mat-icon>
          <span class="font-semibold text-sm">Carregando material de estudos...</span>
        </div>
      } @else if (error() || !lesson()) {
        <div class="flex-grow flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-8 text-center max-w-sm mx-auto h-96 animate-fade-in">
          <div class="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <mat-icon class="text-3xl">error_outline</mat-icon>
          </div>
          <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Material não encontrado</h2>
          <p class="mb-6 text-xs text-slate-400">O conteúdo que você tenta acessar não existe ou foi removido do sistema.</p>
          <button (click)="goBack()" class="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all text-xs cursor-pointer shadow-md">
            <mat-icon class="mr-2 text-[18px]">arrow_back</mat-icon>
            Voltar para a Turma
          </button>
        </div>
      } @else {
        <div class="p-4 sm:p-6 max-w-[1400px] mx-auto min-h-full">

          <!-- Viewer Header -->
          <header class="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pt-2">
            <a [routerLink]="['/course', lesson()!.course_id]" class="bg-transparent border-none cursor-pointer flex items-center justify-center text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800" title="Voltar ao currículo">
              <mat-icon class="text-[28px] w-7 h-7">arrow_back</mat-icon>
            </a>
            <h2 class="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-100 truncate pr-4">{{ lesson()!.title }}</h2>
          </header>

          <div class="flex flex-col lg:grid lg:grid-cols-[1fr_350px] gap-6 items-start">

            <!-- Left Side Content Column -->
            <div class="flex flex-col gap-6 w-full min-w-0">
              
              <!-- Viewer Iframe / Media Frame -->
              <div 
                [class.fixed]="isCinemaMode()" 
                [class.inset-0]="isCinemaMode()" 
                [class.z-[100]]="isCinemaMode()" 
                [class.bg-black]="isCinemaMode()"
                [class.rounded-2xl]="!isCinemaMode()"
                [class.aspect-video]="!isCinemaMode()"
                [class.h-screen]="isCinemaMode()"
                [class.w-screen]="isCinemaMode()"
                class="overflow-hidden shadow-md relative border border-slate-200 dark:border-slate-800 bg-slate-950 transition-all duration-300"
              >
                <!-- Cinema Header Controller -->
                @if (isCinemaMode()) {
                  <div class="absolute top-4 left-4 z-[101] bg-black/70 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-white border border-white/10 shadow-lg animate-fade-in">
                    <button (click)="toggleCinemaMode()" class="flex items-center text-white hover:text-indigo-400 transition-colors border-none bg-transparent cursor-pointer">
                      <mat-icon class="text-[20px]">close</mat-icon>
                      <span class="ml-1 text-xs font-semibold">Sair do Cinema</span>
                    </button>
                    <div class="h-4 w-px bg-white/20 mx-1"></div>
                    <span class="text-xs font-bold truncate max-w-[200px] sm:max-w-[400px]">{{ lesson()!.title }}</span>
                  </div>
                }

                @if (safeUrl()) {
                  <iframe
                    [src]="safeUrl()"
                    class="w-full h-full border-none absolute inset-0 bg-white"
                    allowfullscreen
                    loading="lazy"
                  ></iframe>
                } @else {
                  <div class="absolute inset-0 flex items-center justify-center text-slate-500 bg-slate-900">
                    <div class="text-center p-4">
                      <mat-icon class="text-5xl mb-2 text-slate-500">link_off</mat-icon>
                      <p class="text-sm font-semibold text-slate-300">O link para este material não é incorporável.</p>
                      <a [href]="embedService.getOriginalUrl(lesson()?.link_drive)" target="_blank" class="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all inline-block text-xs font-bold shadow-md cursor-pointer">
                        Abrir em Nova Aba
                      </a>
                    </div>
                  </div>
                }
              </div>

              <!-- Quick Action Bar -->
              <div class="flex items-center gap-3 mb-2 flex-wrap px-1">
                @if (lesson()?.link_drive) {
                  <a [href]="embedService.getOriginalUrl(lesson()?.link_drive)" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-full hover:border-indigo-200 dark:hover:border-indigo-800 shadow-sm cursor-pointer">
                    <mat-icon class="text-[18px] w-[18px] h-[18px]">open_in_new</mat-icon> Link Externo
                  </a>
                }
                <button (click)="shareLesson()" class="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-full hover:border-indigo-200 dark:hover:border-indigo-800 shadow-sm cursor-pointer">
                  <mat-icon class="text-[18px] w-[18px] h-[18px]">share</mat-icon> Compartilhar
                </button>
                <button (click)="toggleSave()" class="flex items-center gap-1.5 text-xs font-bold transition-colors bg-white dark:bg-slate-800 border px-3.5 py-2 rounded-full shadow-sm cursor-pointer" [ngClass]="isSaved() ? 'text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800'">
                  <mat-icon class="text-[18px] w-[18px] h-[18px]">{{ isSaved() ? 'bookmark' : 'bookmark_border' }}</mat-icon> {{ isSaved() ? 'Salvo' : 'Salvar' }}
                </button>
                <button (click)="toggleCompletion()" class="flex items-center gap-1.5 text-xs font-bold transition-colors bg-white dark:bg-slate-800 border px-3.5 py-2 rounded-full shadow-sm cursor-pointer" [ngClass]="isCompleted() ? 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800'">
                  <mat-icon class="text-[18px] w-[18px] h-[18px]">{{ isCompleted() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon> {{ isCompleted() ? 'Concluída' : 'Concluir' }}
                </button>
                @if (!isYouTube()) {
                  <button (click)="toggleCinemaMode()" class="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-full hover:border-indigo-200 dark:hover:border-indigo-800 shadow-sm cursor-pointer">
                    <mat-icon class="text-[18px] w-[18px] h-[18px]">fullscreen</mat-icon> Cinema
                  </button>
                }

                <button (click)="reportProblem()" class="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-full hover:border-rose-200 dark:hover:border-rose-800 shadow-sm cursor-pointer animate-pulse">
                  <mat-icon class="text-[18px] w-[18px] h-[18px] text-rose-500">report_problem</mat-icon> Reportar Bug
                </button>

                <!-- Foco Pomodoro inline next to Reportar Bug -->
                <div class="flex items-center">
                  <button
                    (click)="studyTools.togglePomodoro()"
                    [class]="studyTools.pomodoroRunning() ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-450' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:border-rose-200 dark:hover:border-rose-800'"
                    class="flex items-center gap-1.5 text-xs font-bold transition-all px-3.5 py-2 rounded-full shadow-sm cursor-pointer border"
                    [title]="studyTools.pomodoroRunning() ? 'Pausar Foco' : 'Iniciar Foco'"
                  >
                    <mat-icon
                      class="text-[18px] w-[18px] h-[18px] text-rose-500"
                      [class.animate-pulse]="studyTools.pomodoroRunning()"
                    >
                      timer
                    </mat-icon>
                    <span class="font-mono font-black tracking-wider">{{ studyTools.formatPomodoroTime() }}</span>
                    <span class="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500">
                      {{ studyTools.pomodoroMode() === 'work' ? 'Foco' : 'Pausa' }}
                    </span>
                  </button>

                  <div class="flex items-center gap-1 ml-1.5">
                    <button
                      (click)="editPomodoroTime()"
                      class="w-7.5 h-7.5 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-450 flex items-center justify-center cursor-pointer transition-colors border border-slate-200/60 dark:border-slate-700 shadow-sm"
                      title="Editar tempo"
                    >
                      <mat-icon class="text-[14px] w-[14px] h-[14px]">edit</mat-icon>
                    </button>
                    <button
                      (click)="studyTools.resetPomodoro()"
                      class="w-7.5 h-7.5 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-450 flex items-center justify-center cursor-pointer transition-colors border border-slate-200/60 dark:border-slate-700 shadow-sm"
                      title="Resetar tempo"
                    >
                      <mat-icon class="text-[14px] w-[14px] h-[14px]">refresh</mat-icon>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Lesson Description & Info Panel with Acessibilidade overrides applied [Item 2] -->
              <div
                [class.font-dyslexic]="dyslexicFont()"
                [class.theme-sepia]="visualTheme() === 'sepia'"
                [class.theme-high-contrast]="visualTheme() === 'high-contrast'"
                [style.font-size.px]="15 * (zoomLevel() / 100)"
                class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 transition-all"
              >
                <div>
                  <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">{{ lesson()!.title }}</h1>
                  <!-- Divider -->
                  <div class="h-px w-full bg-slate-200 dark:bg-slate-700/60 my-3"></div>

                  <div class="reading-content min-h-[60px]">
                    <p class="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">{{ lesson()!.description || 'Esta aula aborda as teorias e práticas principais do tema.' }}</p>
                  </div>
                </div>

                <!-- 5 Star rating component -->
                <app-lesson-rating [lessonId]="lesson()!.id!" [initialRating]="userRating()" />

                <!-- Support Material Attachments -->
                @if (attachments().length > 0) {
                  <div class="mt-6 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-inner">
                    <div class="bg-slate-50 dark:bg-slate-800/40 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                      <mat-icon class="text-indigo-600 dark:text-indigo-400 text-[20px]">library_books</mat-icon>
                      <h3 class="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">Materiais Complementares</h3>
                      <span class="ml-auto bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-full">{{ attachments().length }}</span>
                    </div>
                    <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-slate-800/40">
                      @for (att of attachments(); track att.id) {
                        <a [href]="att.url" target="_blank" class="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group cursor-pointer">
                           <div class="w-10 h-10 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
                             <mat-icon>{{ getIconForType(att.file_type) }}</mat-icon>
                           </div>
                           <div class="flex-grow min-w-0">
                             <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{{ att.title }}</h4>
                             <p class="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">{{ att.file_type }}</p>
                           </div>
                           <mat-icon class="text-slate-300 dark:text-slate-500 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</mat-icon>
                        </a>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Fluid navigation buttons (Previous / Next) -->
              <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mt-2 shadow-sm">
                <div>
                  @if (hasPrevLesson()) {
                    <button (click)="goToLesson(prevLesson()!.id!)" class="flex items-center gap-2 py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-xs font-bold cursor-pointer bg-transparent">
                      <mat-icon class="text-[18px] w-[18px] h-[18px]">chevron_left</mat-icon>
                      <span>Anterior: {{ prevLesson()!.title | slice:0:18 }}{{ prevLesson()!.title.length > 18 ? '...' : '' }}</span>
                    </button>
                  }
                </div>
                <div>
                  @if (hasNextLesson()) {
                    <button (click)="goToLesson(nextLesson()!.id!)" class="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm text-xs font-bold cursor-pointer">
                      <span>Próxima: {{ nextLesson()!.title | slice:0:18 }}{{ nextLesson()!.title.length > 18 ? '...' : '' }}</span>
                      <mat-icon class="text-[18px] w-[18px] h-[18px]">chevron_right</mat-icon>
                    </button>
                  }
                </div>
              </div>

              <!-- Comments Section -->
              @defer (on viewport) {
                <app-lesson-comments [lessonId]="lesson()!.id!" [currentUserId]="appUser()?.id!" />
              } @placeholder {
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 mt-2 shadow-sm min-h-[150px] flex items-center justify-center text-slate-400">
                  <mat-icon class="animate-spin text-2xl mr-2">loop</mat-icon> <span class="text-sm font-semibold">Carregando fórum de dúvidas...</span>
                </div>
              }
            </div>

            <!-- Right Side Syllabus Sidebar with type filters [Item 9] -->
            <aside class="sidebar relative w-full lg:sticky lg:top-6 lg:self-start lg:h-[calc(100vh-8rem)] space-y-3">

              <!-- Content Formats Tab Filters [Item 9] -->
              <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm">
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1.5 mb-2">Filtrar Formato</div>

                <div class="flex bg-slate-100 dark:bg-slate-700/50 p-0.5 rounded-lg w-full">
                  <button
                    (click)="lessonTypeFilter.set('all')"
                    [class]="lessonTypeFilter() === 'all' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-700 dark:text-white font-bold' : 'text-slate-500'"
                    class="flex-1 py-1 text-[9px] font-bold rounded transition-colors cursor-pointer"
                  >
                    Todos
                  </button>
                  <button
                    (click)="lessonTypeFilter.set('video')"
                    [class]="lessonTypeFilter() === 'video' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-700 dark:text-white font-bold' : 'text-slate-500'"
                    class="flex-1 py-1 text-[9px] font-bold rounded transition-colors cursor-pointer"
                  >
                    Vídeos
                  </button>
                  <button
                    (click)="lessonTypeFilter.set('text')"
                    [class]="lessonTypeFilter() === 'text' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-700 dark:text-white font-bold' : 'text-slate-500'"
                    class="flex-1 py-1 text-[9px] font-bold rounded transition-colors cursor-pointer"
                  >
                    Leituras
                  </button>
                </div>
              </div>

              <!-- List container -->
              <div class="flex flex-col gap-2 overflow-y-auto pr-1 pb-10 max-h-[450px]">
                @for (item of filteredSidebarLessons(); track item.id) {
                   <button class="flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-colors border group bg-transparent w-full cursor-pointer"
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
                       
                       <div class="relative w-[96px] min-w-[96px] h-[54px] rounded-lg border border-slate-200/50 dark:border-slate-700 overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 shadow-sm">
                          @if (embedService.getThumbnailUrl(item.link_drive)) {
                             <img [src]="embedService.getThumbnailUrl(item.link_drive)" alt="" class="w-full h-full object-cover">
                          } @else {
                             <div class="w-full h-full flex items-center justify-center bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-400">
                                <mat-icon class="text-[20px]">{{ embedService.getIconForFileType(item.file_type) }}</mat-icon>
                             </div>
                          }
                          <span class="absolute bottom-1 right-1 text-[8px] bg-black/70 text-white font-black px-1 py-0.5 rounded backdrop-blur-sm shadow-sm">{{item.file_type | uppercase}}</span>
                       </div>
                       
                       <div class="flex flex-col gap-0.5 pt-0.5 min-w-0 flex-1">
                          <span class="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" [class.text-indigo-700]="item.id === lesson()?.id" [class.dark:text-indigo-300]="item.id === lesson()?.id">{{item.title}}</span>
                          <span class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 truncate mt-0.5">{{item.description || 'Aula'}}</span>
                       </div>
                   </button>
                } @empty {
                   <div class="text-xs text-slate-400 text-center py-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 border-dashed dark:border-slate-700">
                      Nenhum outro conteúdo deste formato.
                   </div>
                }
              </div>
            </aside>

          </div>
        </div>
      }

      <!-- Floating Action Button (Alternative 3) [Item 2] -->
      <div class="fixed bottom-6 right-6 z-50 accessibility-popover-container">
        <button
          (click)="showAccessibilityPopover.set(!showAccessibilityPopover())"
          class="w-13 h-13 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer relative"
          title="Acessibilidade e Conforto Visual"
        >
          <mat-icon class="text-[26px] w-[26px] h-[26px]">accessibility</mat-icon>

          @if (zoomLevel() !== 100 || dyslexicFont() || visualTheme() !== 'normal') {
            <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
          }
        </button>

        @if (showAccessibilityPopover()) {
          <div class="absolute bottom-16 right-0 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4.5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div class="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-700/50 pb-2">
              <h3 class="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <mat-icon class="text-indigo-500 text-[18px] w-[18px] h-[18px]">accessibility</mat-icon>
                Ajustes Visuais
              </h3>
              <button (click)="showAccessibilityPopover.set(false)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer bg-transparent border-none">
                <mat-icon class="text-[16px] w-[16px] h-[16px]">close</mat-icon>
              </button>
            </div>

            <div class="space-y-3.5">
              <!-- Font Zoom controls -->
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-500 font-semibold">Tamanho da Fonte:</span>
                <div class="flex items-center gap-2">
                  <button (click)="changeZoom(-10)" class="w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center font-bold hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer" title="Diminuir texto">A-</button>
                  <span class="font-bold text-slate-700 dark:text-slate-200">{{ zoomLevel() }}%</span>
                  <button (click)="changeZoom(10)" class="w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center font-bold hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer" title="Aumentar texto">A+</button>
                </div>
              </div>

              <!-- OpenDyslexic toggle button -->
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-500 font-semibold">Fonte OpenDyslexic:</span>
                <button
                  (click)="dyslexicFont.set(!dyslexicFont())"
                  [class]="dyslexicFont() ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold'"
                  class="px-3 py-1 rounded-lg text-[10px] transition-colors cursor-pointer"
                >
                  {{ dyslexicFont() ? 'Ativada ✓' : 'Desativada' }}
                </button>
              </div>

              <!-- Reading Themes toggle -->
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-500 font-semibold">Tema de Leitura:</span>
                <div class="flex gap-1.5 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                  <button
                    (click)="visualTheme.set('normal')"
                    [class.bg-white]="visualTheme() === 'normal'"
                    [class.dark:bg-slate-600]="visualTheme() === 'normal'"
                    [class.text-indigo-600]="visualTheme() === 'normal'"
                    [class.dark:text-white]="visualTheme() === 'normal'"
                    [class.font-bold]="visualTheme() === 'normal'"
                    class="px-2.5 py-1 text-[10px] rounded text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                  >
                    Padrão
                  </button>
                  <button
                    (click)="visualTheme.set('sepia')"
                    [class.bg-white]="visualTheme() === 'sepia'"
                    [class.dark:bg-slate-600]="visualTheme() === 'sepia'"
                    [class.text-indigo-600]="visualTheme() === 'sepia'"
                    [class.dark:text-white]="visualTheme() === 'sepia'"
                    [class.font-bold]="visualTheme() === 'sepia'"
                    class="px-2.5 py-1 text-[10px] rounded text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                  >
                    Sépia
                  </button>
                  <button
                    (click)="visualTheme.set('high-contrast')"
                    [class.bg-white]="visualTheme() === 'high-contrast'"
                    [class.dark:bg-slate-600]="visualTheme() === 'high-contrast'"
                    [class.text-indigo-600]="visualTheme() === 'high-contrast'"
                    [class.dark:text-white]="visualTheme() === 'high-contrast'"
                    [class.font-bold]="visualTheme() === 'high-contrast'"
                    class="px-2.5 py-1 text-[10px] rounded text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                  >
                    Contraste
                  </button>
                </div>
              </div>

              <!-- Divider -->
              <div class="h-px w-full bg-slate-100 dark:bg-slate-700/50 my-2"></div>

              <!-- Ouvir Aula (TTS) Widget inside Popover -->
              <div class="space-y-2.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <mat-icon class="text-indigo-500 text-[18px] w-[18px] h-[18px]" [class.animate-bounce]="studyTools.ttsSpeaking() && !studyTools.ttsPaused()">volume_up</mat-icon>
                    Ouvir Aula (Voz)
                  </span>

                  <span
                    class="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
                    [class]="studyTools.ttsSpeaking() ? (studyTools.ttsPaused() ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-450' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-450') : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'">
                    {{ studyTools.ttsSpeaking() ? (studyTools.ttsPaused() ? 'Pausada' : 'Lendo') : 'Pronto' }}
                  </span>
                </div>

                <!-- Main TTS controls row -->
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-500 font-semibold">Controles:</span>
                  <div class="flex items-center gap-1.5">
                    <!-- Play/Stop button -->
                    <button
                      (click)="studyTools.toggleTTS()"
                      [class]="studyTools.ttsSpeaking() ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'"
                      class="px-2.5 py-1.5 rounded-lg text-[9px] font-black transition-all cursor-pointer border-none flex items-center gap-1"
                    >
                      <mat-icon class="text-[12px] w-[12px] h-[12px] flex items-center justify-center">{{ studyTools.ttsSpeaking() ? 'stop' : 'play_arrow' }}</mat-icon>
                      {{ studyTools.ttsSpeaking() ? 'Parar' : 'Ouvir' }}
                    </button>

                    <!-- Pause/Resume button -->
                    @if (studyTools.ttsSpeaking()) {
                      <button
                        (click)="studyTools.ttsPaused() ? studyTools.resumeTTS() : studyTools.pauseTTS()"
                        class="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-255 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[9px] font-black transition-all cursor-pointer border-none flex items-center justify-center"
                        [title]="studyTools.ttsPaused() ? 'Retomar' : 'Pausar'"
                      >
                        <mat-icon class="text-[12px] w-[12px] h-[12px] flex items-center justify-center">{{ studyTools.ttsPaused() ? 'play_arrow' : 'pause' }}</mat-icon>
                      </button>
                    }
                  </div>
                </div>

                <!-- TTS Speed Selector row -->
                <div class="flex items-center justify-between text-xs mt-1">
                  <span class="text-slate-500 font-semibold">Velocidade:</span>
                  <select
                    [value]="studyTools.ttsSpeed()"
                    (change)="studyTools.updateTTSSpeed(+$any($event.target).value)"
                    class="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-600 rounded-lg px-2 py-1 font-bold cursor-pointer outline-none text-[10px] hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    title="Velocidade de Leitura"
                  >
                    <option [value]="1">1.0x</option>
                    <option [value]="1.25">1.25x</option>
                    <option [value]="1.5">1.5x</option>
                    <option [value]="1.75">1.75x</option>
                    <option [value]="2">2.0x</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class LessonViewerPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private supabase = inject(SupabaseService);
  protected embedService = inject(EmbedUrlService);
  private dialog = inject(DialogService);
  private toast = inject(ToastService);
  private progressService = inject(ProgressService);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        if (this.isCinemaMode()) {
          document.body.classList.add('cinema-mode');
        } else {
          document.body.classList.remove('cinema-mode');
        }
      }
    });
  }

  appUser = this.supabase.appUser;
  
  lesson = signal<Lesson | null>(null);
  courseLessons = signal<Lesson[]>([]);

  // Format toggles (Video vs Text/PDF) [Item 9]
  lessonTypeFilter = signal<'all' | 'video' | 'text'>('all');

  filteredSidebarLessons = computed(() => {
    const f = this.lessonTypeFilter();
    const list = this.courseLessons();
    if (f === 'all') return list;
    return list.filter(item => {
      // Qualify as video if type is 'video' or url hosts streaming domains
      const isVid = item.file_type === 'video' ||
                    item.link_drive?.includes('youtube.com') ||
                    item.link_drive?.includes('youtu.be') ||
                    item.link_drive?.includes('drive.google.com/file') ||
                    item.link_drive?.includes('drive.google.com/open');
      return f === 'video' ? isVid : !isVid;
    });
  });

  // Acessibilidade Pedagógica signals [Item 2]
  zoomLevel = signal<number>(100);
  dyslexicFont = signal<boolean>(false);
  visualTheme = signal<'normal' | 'sepia' | 'high-contrast'>('normal');
  showAccessibilityPopover = signal<boolean>(false);

  protected studyTools = inject(StudyToolsService);

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

  isCinemaMode = signal<boolean>(false);
  userRating = signal<number | null>(null);
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

  // Keyboard shortcuts: ← previous lesson, → next lesson, Esc cinema mode
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    const tag = (event.target as HTMLElement).tagName.toLowerCase();
    if (tag === 'textarea' || tag === 'input') return;

    const lessons = this.courseLessons();
    const currentId = this.lesson()?.id;
    const currentIndex = lessons.findIndex(l => l.id === currentId);

    if (event.key === 'Escape' && this.isCinemaMode()) {
      this.exitCinemaMode();
    }

    if (event.key === 'ArrowRight' && currentIndex < lessons.length - 1) {
      this.goToLesson(lessons[currentIndex + 1].id!);
    } else if (event.key === 'ArrowLeft' && currentIndex > 0) {
      this.goToLesson(lessons[currentIndex - 1].id!);
    }
  }

  // Acessibilidade Zoom [Item 2]
  changeZoom(delta: number) {
    this.zoomLevel.update(curr => {
      const next = curr + delta;
      return next >= 80 && next <= 150 ? next : curr;
    });
  }

  async editPomodoroTime() {
    const currentMin = Math.floor(this.studyTools.pomodoroTime() / 60);
    const result = await this.dialog.prompt({
      title: 'Editar Tempo do Temporizador ⏱️',
      message: 'Defina a duração do timer em minutos (ex: 25, 45, 50):',
      inputDefault: currentMin.toString(),
      confirmLabel: 'Ajustar Tempo'
    });

    if (result !== null && result.trim() !== '') {
      const minutes = parseInt(result.trim(), 10);
      if (!isNaN(minutes) && minutes > 0 && minutes <= 180) {
        this.studyTools.pomodoroTime.set(minutes * 60);
        this.toast.success(`Duração ajustada para ${minutes} minutos!`);
      } else {
        this.toast.error('Por favor, insira um número válido de minutos entre 1 e 180.');
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      const target = event.target as HTMLElement;
      // Close popover if click is outside of the popover and its toggle button
      if (this.showAccessibilityPopover() && !target.closest('.accessibility-popover-container')) {
        this.showAccessibilityPopover.set(false);
      }
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
              // Save last visual view timestamp to localStorage [Item 5]
              if (isPlatformBrowser(this.platformId)) {
                localStorage.setItem(`sima_course_last_viewed_${lessonData.course_id}`, new Date().toISOString());
              }
            }
          
          this.lesson.set(lessonData);
          this.studyTools.textToSpeak.set(lessonData?.description || 'Esta aula aborda as teorias e práticas principais do tema.');
          
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
          
          // Pre-load ratings
          await this.loadUserRating(id);
          
        } catch (e) {
          console.error(e);
          this.error.set(true);
        } finally {
          this.isLoading.set(false);
        }
      }
    });
  }

  ngOnDestroy() {
    // Limpeza do TTS — previne leitura fantasma em background [Item 11]
    if (isPlatformBrowser(this.platformId)) {
      window.speechSynthesis.cancel();
    }
    this.studyTools.ttsSpeaking.set(false);
    this.studyTools.ttsPaused.set(false);
    this.studyTools.textToSpeak.set(null);

    // Limpeza do Modo Cinema — garante que o body nunca fique travado [Item 12]
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.remove('cinema-mode');
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
    this.exitCinemaMode(); // Reset ao trocar de aula
    this.router.navigate(['/lesson', id, 'viewer']);
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  toggleCinemaMode() {
    this.isCinemaMode.update(v => !v);
  }

  exitCinemaMode() {
    this.isCinemaMode.set(false);
  }

  async loadUserRating(lessonId: string) {
    try {
      const rating = await this.courseService.getUserLessonRating(lessonId);
      this.userRating.set(rating);
    } catch (e) {
      console.error(e);
    }
  }

  goBack() {
    if (isPlatformBrowser(this.platformId)) {
      window.history.back();
    }
  }

  checkIfSaved(lessonId: string) {
    if (!isPlatformBrowser(this.platformId)) {
      this.isSaved.set(false);
      return;
    }
    try {
      const raw = localStorage.getItem('saved_lessons');
      if (raw) {
        const savedIds: string[] = JSON.parse(raw);
        this.isSaved.set(savedIds.includes(lessonId));
      } else {
        this.isSaved.set(false);
      }
    } catch (e) {
      this.isSaved.set(false);
    }
  }

  toggleSave() {
    const lessonId = this.lesson()?.id;
    if (!lessonId) return;

    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const raw = localStorage.getItem('saved_lessons');
      let savedIds: string[] = [];
      if (raw) {
        savedIds = JSON.parse(raw);
      }

      if (savedIds.includes(lessonId)) {
        savedIds = savedIds.filter(id => id !== lessonId);
        this.isSaved.set(false);
        this.toast.info('Material removido dos favoritos!');
      } else {
        savedIds.push(lessonId);
        this.isSaved.set(true);
        this.toast.success('Material salvo nos favoritos!');
      }
      localStorage.setItem('saved_lessons', JSON.stringify(savedIds));
    } catch (e) {
      console.error(e);
      this.toast.error('Erro ao salvar material.');
    }
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
    if (!isPlatformBrowser(this.platformId)) return;
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
