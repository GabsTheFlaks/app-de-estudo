import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CourseService } from './course.service';

@Component({
  selector: 'app-lesson-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule],
  template: `
    <div class="py-8 flex flex-col items-center relative z-10 w-full px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-[calc(100vh-64px)]">
      <div class="max-w-4xl w-full">
        
        <!-- Header -->
        <div class="mb-8 flex flex-col items-start border-b border-slate-200 pb-4">
           <h1 class="text-3xl font-normal text-slate-800 tracking-tight">Criar material de Aula</h1>
           <p class="text-sm text-slate-500 mt-1">Poste um novo vídeo, documento ou link para a turma</p>
        </div>

        <div class="bg-white rounded-lg border border-slate-200 p-6 sm:p-10 shadow-sm">
          <form [formGroup]="lessonForm" (ngSubmit)="onSubmit()" class="space-y-6">
            
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
                  <label for="title" class="block text-sm font-medium text-slate-700 mb-2">Título do Material (obrigatório)</label>
                  <input 
                    id="title" 
                    type="text" 
                    formControlName="title"
                    class="w-full px-4 py-3 bg-slate-50 text-slate-900 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none placeholder-slate-400" 
                    placeholder="Ex: Encontro 07 - Revisão G2"
                  />
                </div>

                <div>
                  <label for="file_type" class="block text-sm font-medium text-slate-700 mb-2">Tipo de Arquivo *</label>
                  <div class="relative">
                    <select 
                      id="file_type" 
                      formControlName="file_type"
                      class="w-full px-4 py-3 bg-slate-50 text-slate-900 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none appearance-none"
                    >
                      <option value="video">Vídeo (YouTube/Drive)</option>
                      <option value="pdf">Documento PDF</option>
                      <option value="docs">Google Docs</option>
                      <option value="pptx">Slides / Apresentação</option>
                      <option value="xls">Planilha</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <mat-icon class="text-lg">expand_more</mat-icon>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Right Col -->
              <div class="space-y-6">
                <div>
                  <label for="link_drive" class="block text-sm font-medium text-slate-700 mb-2">Link do material (Drive/YouTube) *</label>
                  <input 
                    id="link_drive" 
                    type="url" 
                    formControlName="link_drive"
                    class="w-full px-4 py-3 bg-slate-50 text-slate-900 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none placeholder-slate-400" 
                    placeholder="https://..."
                  />
                  <p class="mt-2 text-[12px] text-slate-500 italic">Lembre-se de deixar o link como público para os alunos acessarem.</p>
                </div>
              </div>
            </div>
            
            <div>
              <label for="description" class="block text-sm font-medium text-slate-700 mb-2">Descrição / Instruções (Opcional)</label>
              <textarea 
                id="description" 
                rows="4"
                formControlName="description"
                class="w-full px-4 py-3 bg-slate-50 text-slate-900 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none resize-none placeholder-slate-400" 
                placeholder="Instruções para o aluno, detalhes sobre o material..."
              ></textarea>
            </div>

            <div class="pt-6 flex justify-end items-center mt-4">
              <button [routerLink]="['/course', courseId]" type="button" class="px-5 py-2.5 mr-4 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors text-sm">
                Cancelar
              </button>
              <button 
                type="submit" 
                [disabled]="lessonForm.invalid || isLoading()"
                class="inline-flex justify-center items-center py-2.5 px-8 rounded-lg shadow-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
              >
                @if (isLoading()) {
                  <span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Postando...
                } @else {
                  Postar
                }
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  `
})
export class LessonAdminPage {
  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  courseId = this.route.snapshot.paramMap.get('id');

  lessonForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    file_type: ['video', Validators.required],
    link_drive: ['', [Validators.required]]
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  async onSubmit() {
    if (this.lessonForm.invalid || !this.courseId) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const formValue = this.lessonForm.value;
      await this.courseService.createLesson({
        course_id: this.courseId,
        title: formValue.title!,
        description: formValue.description || '',
        file_type: formValue.file_type!,
        link_drive: formValue.link_drive!
      });
      
      this.isLoading.set(false);
      this.successMessage.set('Material postado com sucesso!');
      
      this.router.navigate(['/course', this.courseId]);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && (error as {code: string}).code === '42P01') {
         this.errorMessage.set('Erro crítico: A tabela "lessons" ainda não foi criada no Supabase. Por favor, rode o script SQL fornecido nas instruções.');
      } else {
         this.errorMessage.set('Erro ao criar o material. Verifique os dados e tente novamente.');
      }
      console.error(error);
      this.isLoading.set(false);
    }
  }
}
