import { Component, inject, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SupabaseService } from '../core/services/supabase.service';
import { ToastService } from '../shared/services/toast.service';
import { SearchService, SearchResult } from '../core/services/search.service';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, FormsModule],
  template: `
    <div class="h-screen w-full bg-slate-50 dark:bg-slate-900 flex overflow-hidden font-sans">
      
      <!-- Toast Stack -->
      <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        @for (toast of toastService.toasts(); track toast.id) {
          <div
            class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl shadow-xl border min-w-[280px] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300"
            [class]="toastClasses(toast.type)">
            <mat-icon class="shrink-0 text-[20px] mt-0.5" [class]="toastIconClass(toast.type)">
              {{ toastIcon(toast.type) }}
            </mat-icon>
            <p class="text-sm font-medium flex-1">{{ toast.message }}</p>
            <button (click)="toastService.dismiss(toast.id)" class="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
              <mat-icon class="text-[18px]">close</mat-icon>
            </button>
          </div>
        }
      </div>
      
      <!-- Overlay for mobile sidebar -->
      @if (isSidebarOpen()) {
        <div 
          class="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          (click)="toggleSidebar()"
          (keyup.enter)="toggleSidebar()" 
          tabindex="0"
        ></div>
      }

      <!-- Sidebar -->
      <aside 
        class="fixed inset-y-0 left-0 bg-white dark:bg-slate-900 shadow-xl z-50 w-72 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 border-r border-slate-200 dark:border-slate-800 flex flex-col"
        [class.-translate-x-full]="!isSidebarOpen()"
      >
        <div class="h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <button (click)="toggleSidebar()" class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors mr-3 lg:hidden">
            <mat-icon>menu</mat-icon>
          </button>
          <div class="text-xl font-medium text-slate-800 dark:text-slate-100">SIMA</div>
        </div>

        <nav class="flex-1 overflow-y-auto py-2">
          <div class="px-3 space-y-1">
            <a routerLink="/dashboard" routerLinkActive="bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400" [routerLinkActiveOptions]="{exact: true}" (click)="closeOnMobile()" class="flex items-center px-4 py-3 rounded-r-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <mat-icon class="mr-4 text-[20px] text-slate-500 dark:text-slate-400">home</mat-icon>
              Início
            </a>
            <a routerLink="/saved-lessons" routerLinkActive="bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400" (click)="closeOnMobile()" class="flex items-center px-4 py-3 rounded-r-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <mat-icon class="mr-4 text-[20px] text-slate-500 dark:text-slate-400">bookmark</mat-icon>
              Salvos
            </a>
          </div>

          <div class="mt-4 px-3">
            <a routerLink="/my-courses" routerLinkActive="bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400" (click)="closeOnMobile()" class="flex justify-between items-center px-4 py-3 rounded-r-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div class="flex items-center">
                <mat-icon class="mr-4 text-[20px] text-slate-500 dark:text-slate-400">school</mat-icon>
                Minhas Inscrições
              </div>
            </a>
          </div>

          <div class="mt-4 border-t border-slate-200 dark:border-slate-800 pt-4 px-3 space-y-1">
            <a routerLink="/settings" routerLinkActive="bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400" (click)="closeOnMobile()" class="flex items-center px-4 py-3 rounded-r-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <mat-icon class="mr-4 text-[20px] text-slate-500 dark:text-slate-400">settings</mat-icon>
              Configurações
            </a>
          </div>
        </nav>
      </aside>

      <!-- Main Content Container -->
      <div class="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
        <!-- Top Navigation -->
        <header class="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30">
          <div class="flex items-center">
            <button (click)="toggleSidebar()" class="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors mr-2">
              <mat-icon>menu</mat-icon>
            </button>
            <!-- Global Search -->
            <div class="relative hidden sm:block">
              <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">search</mat-icon>
              <input
                type="text"
                [ngModel]="searchModel"
                (ngModelChange)="onSearch($event)"
                placeholder="Buscar turmas e aulas..."
                (focus)="searchFocused.set(true)"
                (blur)="onSearchBlur()"
                class="pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 transition-all focus:w-80"
              />
              @if (searchFocused() && searchResults().length > 0) {
                <div class="absolute top-full mt-2 left-0 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  @for (result of searchResults(); track result.id) {
                    <button
                      (mousedown)="navigateTo(result)"
                      class="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-left transition-colors">
                      <mat-icon class="text-[18px] shrink-0" [class]="result.type === 'course' ? 'text-indigo-500' : 'text-emerald-500'">
                        {{ result.type === 'course' ? 'school' : 'play_circle' }}
                      </mat-icon>
                      <div class="min-w-0">
                        <p class="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{{ result.title }}</p>
                        @if (result.subtitle) {
                          <p class="text-xs text-slate-400 truncate">{{ result.subtitle }}</p>
                        }
                      </div>
                    </button>
                  }
                </div>
              }
              @if (searchFocused() && searchModel.length > 1 && searchResults().length === 0 && !isSearching()) {
                <div class="absolute top-full mt-2 left-0 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-4 text-center text-sm text-slate-400">
                  Nenhum resultado para "{{ searchModel }}"
                </div>
              }
            </div>
          </div>

          <div class="flex items-center space-x-2 relative">
            @if (appUser()?.role === 'admin') {
              <a routerLink="/admin" class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors" title="Criar turma">
                <mat-icon>add</mat-icon>
              </a>
            }
            
            <!-- Apps Menu -->
            <button (click)="toggleAppsMenu()" class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors hidden sm:block" title="Google Apps">
              <mat-icon>apps</mat-icon>
            </button>
            @if (isAppsMenuOpen()) {
              <div class="absolute top-[48px] right-20 w-80 bg-white dark:bg-slate-800 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.15)] dark:shadow-black/50 border border-slate-200 dark:border-slate-700 z-50 p-4 grid grid-cols-3 gap-2 origin-top-right">
                <a routerLink="/dashboard" (click)="isAppsMenuOpen.set(false)" class="flex flex-col items-center justify-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl transition-colors gap-2">
                  <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <mat-icon>home</mat-icon>
                  </div>
                  <span class="text-xs font-medium text-slate-700 dark:text-slate-300">Início</span>
                </a>
                <a routerLink="/saved-lessons" (click)="isAppsMenuOpen.set(false)" class="flex flex-col items-center justify-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl transition-colors gap-2">
                  <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-red-500 dark:text-red-400">
                    <mat-icon>bookmark</mat-icon>
                  </div>
                  <span class="text-xs font-medium text-slate-700 dark:text-slate-300 justify-center flex w-full truncate">Salvos</span>
                </a>
                <a routerLink="/my-courses" (click)="isAppsMenuOpen.set(false)" class="flex flex-col items-center justify-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl transition-colors gap-2">
                  <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-amber-500 dark:text-amber-400">
                    <mat-icon>school</mat-icon>
                  </div>
                  <span class="text-xs font-medium text-slate-700 dark:text-slate-300">Inscrições</span>
                </a>
                <a routerLink="/settings" (click)="isAppsMenuOpen.set(false)" class="flex flex-col items-center justify-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl transition-colors gap-2">
                  <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <mat-icon>settings</mat-icon>
                  </div>
                  <span class="text-xs font-medium text-slate-700 dark:text-slate-300">Ajustes</span>
                </a>
              </div>
              <div class="fixed inset-0 z-40" (click)="isAppsMenuOpen.set(false)" (keyup.enter)="isAppsMenuOpen.set(false)" tabindex="0"></div>
            }

            <div class="relative ml-2 z-50">
              <a routerLink="/profile" class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-medium cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all border border-transparent overflow-hidden">
                @if (appUser()?.avatar_url) {
                  <img [src]="appUser()?.avatar_url" alt="" class="w-full h-full object-cover">
                } @else {
                  {{ appUser()?.firstname?.[0]?.toUpperCase() || 'U' }}
                }
              </a>
            </div>
            
            <button (click)="logout()" class="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors ml-1" title="Sair">
              <mat-icon>logout</mat-icon>
            </button>
          </div>
        </header>

        <!-- Main Area -->
        <main class="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-slate-900">
           <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
})
export class LayoutComponent implements OnInit, OnDestroy {
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  protected toastService = inject(ToastService);
  private searchService = inject(SearchService);

  appUser = this.supabase.appUser;

  // Search state
  searchModel = '';
  searchResults = signal<SearchResult[]>([]);
  searchFocused = signal(false);
  isSearching = signal(false);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  
  // Sidebar starts open on desktop (lg+), closed on mobile
  isSidebarOpen = signal<boolean>(window.innerWidth >= 1024);
  isAppsMenuOpen = signal<boolean>(false);

  private realtimeChannel: RealtimeChannel | null = null;
  private notificationTimeout: ReturnType<typeof setTimeout> | null = null;

  @HostListener('window:resize')
  onResize() {
    // Auto-adjust sidebar on window resize
    if (window.innerWidth >= 1024) {
      this.isSidebarOpen.set(true);
    }
  }

  ngOnInit() {
    // Only subscribe to real-time events if connected
    if (this.supabase.client.auth) {
      this.realtimeChannel = this.supabase.client
        .channel('public:lessons_and_comments')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lessons' }, payload => {
          if (payload.new && payload.new['title']) {
            this.toastService.info(`Nova aula postada: ${payload.new['title']}`);
          }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, payload => {
           if (payload.new && payload.new['user_id'] !== this.appUser()?.id) {
             this.toastService.info(`Novo comentário: ${String(payload.new['content']).slice(0, 60)}`);
           }
        })
        .subscribe();
    }
  }

  ngOnDestroy() {
    // Fix memory leak: properly cleanup realtime channel
    if (this.realtimeChannel) {
      this.supabase.client.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }

  onSearch(val: string) {
    this.searchModel = val;
    if (this.searchTimer) clearTimeout(this.searchTimer);
    if (val.trim().length < 2) { this.searchResults.set([]); return; }
    this.isSearching.set(true);
    this.searchTimer = setTimeout(async () => {
      const results = await this.searchService.search(val);
      this.searchResults.set(results);
      this.isSearching.set(false);
    }, 300);
  }

  onSearchBlur() {
    // Small delay so mousedown on result fires before blur clears
    setTimeout(() => this.searchFocused.set(false), 150);
  }

  navigateTo(result: SearchResult) {
    this.router.navigate(result.route);
    this.searchModel = '';
    this.searchResults.set([]);
    this.searchFocused.set(false);
  }

  showNotification(msg: string) {
    this.toastService.info(msg);
  }

  toastClasses(type: string): string {
    const base = 'bg-white dark:bg-slate-800 border ';
    const map: Record<string, string> = {
      success: base + 'border-emerald-200 dark:border-emerald-800',
      error:   base + 'border-red-200 dark:border-red-800',
      warning: base + 'border-amber-200 dark:border-amber-800',
      info:    base + 'border-indigo-200 dark:border-indigo-800',
    };
    return map[type] ?? map['info'];
  }

  toastIconClass(type: string): string {
    const map: Record<string, string> = {
      success: 'text-emerald-500',
      error:   'text-red-500',
      warning: 'text-amber-500',
      info:    'text-indigo-500',
    };
    return map[type] ?? map['info'];
  }

  toastIcon(type: string): string {
    const map: Record<string, string> = {
      success: 'check_circle',
      error:   'error',
      warning: 'warning',
      info:    'info',
    };
    return map[type] ?? 'info';
  }

  toggleSidebar() {
    this.isSidebarOpen.update(val => !val);
  }

  toggleAppsMenu() {
    this.isAppsMenuOpen.update(v => !v);
  }

  closeOnMobile() {
    if (window.innerWidth < 1024) { // lg breakpoint
      this.isSidebarOpen.set(false);
    }
  }

  async logout() {
    await this.supabase.client.auth.signOut();
    this.router.navigate(['/login']);
  }
}
