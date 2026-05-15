import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CourseService } from '../../core/services/course.service';
import { CourseImageComponent } from '../../shared/components/course-image.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CourseImageComponent, MatIconModule],
  template: `
    <div class="py-8 flex flex-col items-center relative z-10 w-full px-4 sm:px-6 lg:px-8">
      <div class="max-w-6xl w-full animate-fade-in">
        
        <!-- Header -->
        <div class="mb-8 flex flex-col items-start border-b border-slate-200 dark:border-slate-700 pb-4">
           <h1 class="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Painel do Administrador</h1>
           <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Gerencie o sistema, crie turmas e monitore a qualidade operacional.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Formulário de Criação -->
          <div class="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-10 shadow-sm h-fit">
            <div class="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-4">
              <mat-icon class="text-indigo-600 dark:text-indigo-400">add_circle</mat-icon>
              <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">Criar Nova Turma</h2>
            </div>
          <form [formGroup]="courseForm" (ngSubmit)="onSubmit()" class="space-y-6">
            
            @if (errorMessage()) {
              <div class="bg-red-50 text-red-600 text-sm p-4 rounded-lg flex items-start">
                 <mat-icon class="mr-2 text-red-500 mt-0.5" style="font-size: 20px; width: 20px; height: 20px;">error_outline</mat-icon>
                 {{ errorMessage() }}
              </div>
            }

            @if (successMessage()) {
              <div class="bg-emerald-50 text-emerald-600 text-sm p-4 rounded-lg flex items-start">
                 <mat-icon class="mr-2 text-emerald-500 mt-0.5" style="font-size: 20px; width: 20px; height: 20px;">check_circle</mat-icon>
                 {{ successMessage() }}
              </div>
            }

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <!-- Left Col -->
              <div class="space-y-6">
                <div>
                  <label for="title" class="block text-sm font-medium text-slate-700 mb-2">Nome da turma (obrigatório)</label>
                  <input 
                    id="title" 
                    type="text" 
                    formControlName="title" 
                    class="w-full px-4 py-3 bg-slate-50 text-slate-900 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none placeholder-slate-400" 
                    placeholder="Ex: Produção Enxuta 2026_1"
                  />
                </div>

                <div>
                  <label for="category" class="block text-sm font-medium text-slate-700 mb-2">Seção/Categoria</label>
                  <input 
                    id="category" 
                    type="text" 
                    formControlName="category" 
                    class="w-full px-4 py-3 bg-slate-50 text-slate-900 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none placeholder-slate-400" 
                    placeholder="Ex: Engenharia de Produção"
                  />
                </div>
              </div>

              <!-- Right Col -->
              <div class="space-y-6">
                <div>
                  <label for="thumbnail_url" class="block text-sm font-medium text-slate-700 mb-2">URL da Capa da Turma (imagem de fundo)</label>
                  <input 
                    id="thumbnail_url" 
                    type="url" 
                    formControlName="thumbnail_url" 
                    class="w-full px-4 py-3 bg-slate-50 text-slate-900 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none placeholder-slate-400 mb-4" 
                    placeholder="https://..."
                  />
                  
                  <div class="w-full h-[100px] bg-slate-100 rounded-lg border border-slate-200 overflow-hidden relative flex items-center justify-center">
                    @if (courseForm.value.thumbnail_url) {
                      <app-course-image [src]="courseForm.value.thumbnail_url" alt="Preview" [showPreviewWarning]="true" class="w-full h-full block"></app-course-image>
                    } @else {
                      <div class="flex flex-col items-center justify-center text-slate-400">
                        <mat-icon class="text-3xl mb-1 text-slate-300">image</mat-icon>
                        <span class="text-xs font-semibold uppercase tracking-wider">Preview da Capa</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <label for="description" class="block text-sm font-medium text-slate-700 mb-2">Descrição da Turma (Assunto/Sala/Detalhes)</label>
              <textarea 
                id="description" 
                rows="3"
                formControlName="description" 
                class="w-full px-4 py-3 bg-slate-50 text-slate-900 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none resize-none placeholder-slate-400" 
                placeholder="Detalhes breves do curso..."
              ></textarea>
            </div>

            <div class="pt-6 flex justify-end">
              <button routerLink="/dashboard" type="button" class="px-5 py-2 mr-3 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button 
                type="submit" 
                [disabled]="courseForm.invalid || isLoading()"
                class="inline-flex justify-center items-center py-2 px-6 rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                @if (isLoading()) {
                  <span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Criando...
                } @else {
                  Criar
                }
              </button>
            </div>
          </form>
        </div>

        <!-- Coluna Direita: Painel Andon (Alertas Operacionais) -->
        <div class="lg:col-span-1 flex flex-col gap-6">
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <!-- Top Header Alerta -->
            <div class="bg-rose-50 dark:bg-rose-950/20 px-5 py-4 border-b border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
                <h3 class="font-bold text-rose-800 dark:text-rose-400 tracking-tight flex items-center gap-1 text-sm uppercase">
                  <mat-icon class="text-rose-600 dark:text-rose-500 text-[20px]">report_problem</mat-icon> Painel Andon 🚨
                </h3>
              </div>
              <span class="px-2.5 py-0.5 bg-rose-600 text-white text-xs font-black rounded-full shadow-sm">{{ activeAlerts().length }}</span>
            </div>

            <!-- Lista de Alertas -->
            <div class="p-4 bg-rose-50/20 dark:bg-rose-950/5 max-h-[580px] overflow-y-auto space-y-4">
              @if (activeAlerts().length === 0) {
                <div class="text-center py-12 text-slate-400 dark:text-slate-500 flex flex-col items-center animate-pulse">
                  <mat-icon class="text-4xl mb-2 text-slate-300 dark:text-slate-600">check_circle_outline</mat-icon>
                  <p class="text-xs font-bold uppercase tracking-widest">Processo Estável</p>
                  <p class="text-[11px] mt-1">Nenhum problema reportado pelos alunos.</p>
                </div>
              } @else {
                @for (alert of activeAlerts(); track alert.id) {
                  <div class="bg-white dark:bg-slate-800 border-l-4 border-l-rose-500 dark:border border-slate-200 dark:border-slate-700 p-4 rounded-lg shadow-sm relative flex flex-col gap-3 animate-fade-in duration-200">
                    <div class="flex flex-col">
                      <div class="flex items-center justify-between mb-1">
                        <span class="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-widest">ALERTA ATIVO</span>
                        <span class="text-[9px] font-semibold text-slate-400">{{ alert.created_at | date:'dd/MM - HH:mm' }}</span>
                      </div>
                      <p class="text-sm text-slate-800 dark:text-slate-100 font-bold leading-relaxed">"{{ alert.description }}"</p>
                    </div>
                    
                    <!-- Metadados da Origem -->
                    <div class="flex flex-col gap-1 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded border border-slate-100 dark:border-slate-800">
                      <div class="flex items-center gap-1 text-[11px]">
                        <span class="text-slate-500 dark:text-slate-400 font-semibold">Turma:</span>
                        <span class="text-slate-800 dark:text-slate-200 truncate font-bold">{{ alert.courses?.title }}</span>
                      </div>
                      <div class="flex items-center gap-1 text-[11px]">
                        <span class="text-slate-500 dark:text-slate-400 font-semibold">Aula:</span>
                        <span class="text-slate-800 dark:text-slate-200 truncate font-bold">{{ alert.lessons?.title }}</span>
                      </div>
                      <div class="flex items-center gap-1 text-[11px]">
                        <span class="text-slate-500 dark:text-slate-400 font-semibold">Aluno:</span>
                        <span class="text-indigo-600 dark:text-indigo-400 font-bold">{{ alert.user_name }}</span>
                      </div>
                    </div>

                    <!-- Ações -->
                    <div class="flex justify-end pt-1">
                      <button (click)="resolveAlert(alert.id)" class="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer">
                        <mat-icon class="text-[14px] w-[14px] h-[14px] flex items-center font-bold">check</mat-icon> MARCAR COMO RESOLVIDO
                      </button>
                    </div>
                  </div>
                }
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPage implements OnInit {
  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  activeAlerts = signal<any[]>([]);

  async ngOnInit() {
    await this.loadActiveAlerts();
  }

  async loadActiveAlerts() {
    try {
      const alerts = await this.courseService.getPendingAndonAlerts();
      this.activeAlerts.set(alerts);
    } catch (e) {
      console.error("Erro ao carregar alertas Andon:", e);
    }
  }

  async resolveAlert(id: string) {
    try {
      await this.courseService.resolveAndonAlert(id);
      this.activeAlerts.update(list => list.filter(a => a.id !== id));
    } catch (e) {
      console.error("Erro ao resolver alerta:", e);
    }
  }

  courseForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    category: [''],
    thumbnail_url: ['']
  });

  async onSubmit() {
    if (this.courseForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const formValue = this.courseForm.getRawValue();
      await this.courseService.addCourse({
        title: formValue.title,
        description: formValue.description,
        category: formValue.category,
        file_type: 'pdf',
        link_drive: 'none',
        thumbnail_url: formValue.thumbnail_url
      });
      this.successMessage.set('Curso adicionado com sucesso!');
      this.router.navigate(['/dashboard']);
    } catch (e) {
      console.error(e);
      this.errorMessage.set('Erro ao adicionar o curso. Verifique se você tem permissão e tente novamente.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
