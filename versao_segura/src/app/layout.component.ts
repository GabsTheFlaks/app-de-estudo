import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SupabaseService } from './supabase.service';
import { Role } from './enums';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="h-screen w-full bg-slate-50 dark:bg-slate-900 flex overflow-hidden font-sans">

      <!-- Toast Notification -->
      @if (notification()) {
        <div class="fixed bottom-6 right-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-4 flex items-start space-x-3 z-[100] animate-in slide-in-from-bottom-5">
           <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
              <mat-icon class="text-indigo-600 dark:text-indigo-400">notifications_active</mat-icon>
           </div>
           <div>
              <h4 class="text-sm font-medium text-slate-800 dark:text-slate-100">Nova Notificação</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px] break-words">{{ notification() }}</p>
           </div>
           <button (click)="notification.set(null)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <mat-icon class="text-lg">close</mat-icon>
           </button>
        </div>
      }

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
          <div class="text-xl font-medium text-slate-800 dark:text-slate-100">EducaMVP</div>
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
            <a href="javascript:void(0)" class="flex items-center px-4 py-3 rounded-r-full text-sm font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <mat-icon class="mr-4 text-[20px] text-slate-300 dark:text-slate-600">archive</mat-icon>
              Turmas arquivadas
            </a>
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
            <div class="flex items-center space-x-2 text-slate-700 dark:text-slate-100">
              <h1 class="text-[22px] tracking-tight font-normal hidden sm:block">Turmas</h1>
            </div>
          </div>

          <div class="flex items-center space-x-2 relative">
            @if (appUser()?.role === Role.ADMIN) {
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
              <a routerLink="/profile" class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-medium cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all border border-transparent">
                {{ appUser()?.firstname?.[0] || 'A' }}
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

  appUser = this.supabase.appUser;
  Role = Role;

  isSidebarOpen = signal<boolean>(false);
  isAppsMenuOpen = signal<boolean>(false);
  notification = signal<string | null>(null);

  private realtimeChannel: unknown;

  ngOnInit() {
    // Only subscribe to real-time events if connected
    if (this.supabase.client.auth) {
      this.realtimeChannel = this.supabase.client
        .channel('public:lessons_and_comments')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lessons' }, payload => {
          if (payload.new && payload.new['title']) {
            this.showNotification(`Nova aula foi postada: ${payload.new['title']}`);
          }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, payload => {
           if (payload.new && payload.new['user_id'] !== this.appUser()?.id) {
             this.showNotification(`Novo comentário: ${payload.new['content']}`);
           }
        })
        .subscribe();
    }
  }

  ngOnDestroy() {
    if (this.realtimeChannel) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.supabase.client.removeChannel(this.realtimeChannel as any);
    }
  }

  showNotification(msg: string) {
    this.notification.set(msg);
    setTimeout(() => {
       if(this.notification() === msg) {
          this.notification.set(null);
       }
    }, 5000);
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
