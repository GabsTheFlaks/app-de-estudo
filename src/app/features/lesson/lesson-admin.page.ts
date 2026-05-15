import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CourseService } from '../../core/services/course.service';

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

            <!-- Múltiplos Anexos / Materiais de Apoio -->
            <div class="border-t border-slate-200 pt-6 mt-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <div>
                  <h3 class="text-base font-bold text-slate-800">Materiais de Apoio (Opcional)</h3>
                  <p class="text-[13px] text-slate-500 mt-0.5">Adicione arquivos extras, PDFs, planilhas ou links complementares à aula principal.</p>
                </div>
                <button type="button" (click)="addAttachment()" class="text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors flex items-center shrink-0">
                  <mat-icon class="mr-1 text-[18px] w-[18px] h-[18px]">add</mat-icon> Adicionar Anexo
                </button>
              </div>

              <div formArrayName="attachments" class="space-y-4">
                @for (attachment of attachments.controls; track $index) {
                  <div [formGroupName]="$index" class="p-4 bg-slate-50 border border-slate-200 rounded-xl relative flex flex-col md:flex-row gap-4 items-start md:items-end animate-fade-in shadow-sm">
                    <button type="button" (click)="removeAttachment($index)" class="absolute -top-3 -right-3 w-7 h-7 bg-white border border-slate-200 text-rose-500 hover:text-white hover:bg-rose-500 hover:border-rose-500 rounded-full flex items-center justify-center shadow transition-all z-10" title="Remover anexo">
                      <mat-icon class="text-[16px] w-[16px] h-[16px] flex items-center font-bold">close</mat-icon>
                    </button>
                    
                    <div class="w-full md:w-[35%]">
                      <label class="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Título do Anexo *</label>
                      <input formControlName="title" type="text" class="w-full px-3 py-2.5 bg-white text-slate-900 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none" placeholder="Ex: Slide da Aula" />
                    </div>
                    
                    <div class="w-full md:w-[25%]">
                      <label class="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tipo *</label>
                      <select formControlName="file_type" class="w-full px-3 py-2.5 bg-white text-slate-900 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none">
                        <option value="pdf">PDF</option>
                        <option value="docs">Documento</option>
                        <option value="xls">Planilha</option>
                        <option value="link">Link Externo</option>
                      </select>
                    </div>

                    <div class="w-full md:w-[40%]">
                      <label class="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Link / URL *</label>
                      <input formControlName="url" type="url" class="w-full px-3 py-2.5 bg-white text-slate-900 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none" placeholder="https://..." />
                    </div>
                  </div>
                }
                
                @if (attachments.length === 0) {
                  <div class="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <mat-icon class="text-slate-300 text-3xl mb-1">attachment</mat-icon>
                    <p class="text-slate-400 text-sm font-medium">Nenhum material de apoio extra foi anexado.</p>
                  </div>
                }
              </div>
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
    link_drive: ['', [Validators.required]],
    attachments: this.fb.array([])
  });

  get attachments() {
    return this.lessonForm.get('attachments') as FormArray;
  }

  addAttachment() {
    this.attachments.push(this.fb.group({
      title: ['', Validators.required],
      file_type: ['pdf', Validators.required],
      url: ['', Validators.required]
    }));
  }

  removeAttachment(index: number) {
    this.attachments.removeAt(index);
  }

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
      
      // Calcular a próxima ordem automaticamente
      const existingLessons = await this.courseService.getLessons(this.courseId);
      const nextOrder = existingLessons.length + 1;
      
      await this.courseService.createLesson({
        course_id: this.courseId,
        title: formValue.title!,
        description: formValue.description || '',
        file_type: formValue.file_type!,
        link_drive: formValue.link_drive!,
        order: nextOrder
      }, formValue.attachments as any);
      
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
