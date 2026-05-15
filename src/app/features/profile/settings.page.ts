import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="flex flex-col items-center">
      <main class="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 relative z-10">
        <div class="mb-8 border-b border-slate-200 pb-4 dark:border-slate-800">
          <h2 class="text-3xl font-normal text-slate-800 dark:text-slate-100 tracking-tight">Configurações</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Ajuste suas preferências da plataforma.</p>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-8">
          
          <!-- Notificações -->
          <div>
            <h3 class="text-xl font-medium text-slate-800 dark:text-slate-100 mb-4 flex items-center">
              <mat-icon class="mr-2 text-indigo-600 dark:text-indigo-400">notifications</mat-icon>
              Notificações
            </h3>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <div>
                  <div class="font-medium text-slate-800 dark:text-slate-200">Novas turmas</div>
                  <div class="text-sm text-slate-500 dark:text-slate-400">Receba um email quando for adicionado a uma turma.</div>
                </div>
                <div class="w-10 h-6 bg-indigo-600 rounded-full flex items-center justify-end px-1 shadow-inner">
                  <div class="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>

              <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <div>
                  <div class="font-medium text-slate-800 dark:text-slate-200">Avisos da Plataforma</div>
                  <div class="text-sm text-slate-500 dark:text-slate-400">Mudanças importantes e novidades do sistema.</div>
                </div>
                <div class="w-10 h-6 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-start px-1 shadow-inner">
                  <div class="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="w-full h-px bg-slate-200 dark:bg-slate-800"></div>

          <!-- Tema Visual -->
          <div>
            <h3 class="text-xl font-medium text-slate-800 dark:text-slate-100 mb-4 flex items-center">
              <mat-icon class="mr-2 text-indigo-600 dark:text-indigo-400">palette</mat-icon>
              Tema Visual
            </h3>
            
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button 
                (click)="setTheme(false)"
                [class.border-indigo-600]="!themeService.isDarkMode()"
                [class.bg-indigo-50]="!themeService.isDarkMode()"
                [class.dark:bg-indigo-900]="!themeService.isDarkMode()"
                [class.border-2]="!themeService.isDarkMode()"
                [class.border-slate-200]="themeService.isDarkMode()"
                [class.dark:border-slate-700]="themeService.isDarkMode()"
                [class.bg-slate-50]="themeService.isDarkMode()"
                [class.dark:bg-slate-800]="themeService.isDarkMode()"
                [class.border]="themeService.isDarkMode()"
                class="rounded-lg p-4 flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer">
                <mat-icon [class.text-indigo-600]="!themeService.isDarkMode()" [class.dark:text-indigo-400]="!themeService.isDarkMode()" [class.text-slate-400]="themeService.isDarkMode()">light_mode</mat-icon>
                <span class="text-sm font-medium" [class.text-indigo-700]="!themeService.isDarkMode()" [class.dark:text-indigo-300]="!themeService.isDarkMode()" [class.text-slate-500]="themeService.isDarkMode()">Claro</span>
              </button>
              
              <button 
                (click)="setTheme(true)"
                [class.border-indigo-600]="themeService.isDarkMode()"
                [class.bg-indigo-50]="themeService.isDarkMode()"
                [class.dark:bg-indigo-900]="themeService.isDarkMode()"
                [class.border-2]="themeService.isDarkMode()"
                [class.border-slate-200]="!themeService.isDarkMode()"
                [class.dark:border-slate-700]="!themeService.isDarkMode()"
                [class.bg-slate-50]="!themeService.isDarkMode()"
                [class.dark:bg-slate-800]="!themeService.isDarkMode()"
                [class.border]="!themeService.isDarkMode()"
                class="rounded-lg p-4 flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer">
                <mat-icon [class.text-indigo-600]="themeService.isDarkMode()" [class.dark:text-indigo-400]="themeService.isDarkMode()" [class.text-slate-400]="!themeService.isDarkMode()">dark_mode</mat-icon>
                <span class="text-sm font-medium" [class.text-indigo-700]="themeService.isDarkMode()" [class.dark:text-indigo-300]="themeService.isDarkMode()" [class.text-slate-500]="!themeService.isDarkMode()">Escuro</span>
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  themeService = inject(ThemeService);

  setTheme(isDark: boolean) {
    this.themeService.setDarkMode(isDark);
  }
}
