import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-my-courses-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="flex flex-col items-center">
      <main class="w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 relative z-10 w-full">
        <div class="mb-10">
          <h2 class="text-3xl font-normal text-slate-800 tracking-tight">Minhas Inscrições</h2>
          <p class="text-sm text-slate-500 mt-1">Turmas em que você está inscrito.</p>
        </div>

        <div class="text-center py-24 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
          <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 mx-auto border border-slate-200 shadow-sm">
            <mat-icon class="text-3xl text-slate-400">school</mat-icon>
          </div>
          <h3 class="text-lg font-medium text-slate-800">Nenhuma inscrição encontrada</h3>
          <p class="mt-2 text-sm text-slate-500 mb-6 max-w-md mx-auto">Você ainda não se inscreveu em nenhuma turma. Visite a página inicial e encontre sua próxima aula!</p>
          <a routerLink="/dashboard" class="inline-flex py-2 px-6 rounded-lg text-white font-medium bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all text-sm">
            Ir para o Início
          </a>
        </div>
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyCoursesPage {}
