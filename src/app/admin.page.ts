import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CourseService } from './course.service';
import { CourseImageComponent } from './course-image.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CourseImageComponent, MatIconModule],
  template: `
    <div class="py-8 flex flex-col items-center relative z-10 w-full px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl w-full">
        
        <!-- Header -->
        <div class="mb-8 flex flex-col items-start border-b border-slate-200 pb-4">
           <h1 class="text-3xl font-normal text-slate-800 tracking-tight">Adicionar Turma</h1>
           <p class="text-sm text-slate-500 mt-1">Cadastre um novo conteúdo na plataforma educacional</p>
        </div>

        <div class="bg-white rounded-lg border border-slate-200 p-6 sm:p-10">
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
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPage {
  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

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
