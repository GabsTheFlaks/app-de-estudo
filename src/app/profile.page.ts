import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SupabaseService } from './supabase.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  template: `
    <div class="flex flex-col items-center">
      <main class="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 relative z-10">
        <div class="mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
          <h2 class="text-3xl font-normal text-slate-800 dark:text-slate-100 tracking-tight">Meu Perfil</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Gerencie suas informações pessoais.</p>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          
          <div class="flex items-center space-x-6 mb-8">
            <div class="w-24 h-24 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-100 dark:border-indigo-800 flex items-center justify-center overflow-hidden relative group">
              @if (appUser()?.avatar_url) {
                <img [src]="appUser()?.avatar_url" alt="" class="w-full h-full object-cover" />
              } @else {
                <mat-icon class="text-indigo-400" style="font-size: 3rem; width: 3rem; height: 3rem;">person</mat-icon>
              }
            </div>
            <div>
              <h3 class="text-2xl font-medium text-slate-800 dark:text-slate-100">{{ appUser()?.firstname }} {{ appUser()?.lastname }}</h3>
              <p class="text-slate-500 dark:text-slate-400">{{ appUser()?.email }}</p>
              <div class="inline-flex mt-2 px-2 py-1 text-[11px] font-medium rounded uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 pl-1">
                <mat-icon class="text-[14px] leading-none mr-1">star</mat-icon>
                {{ appUser()?.role === 'admin' ? 'Coordenador' : 'Aluno Estudioso' }}
              </div>
            </div>
          </div>

          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="space-y-6">
            @if (errorMessage()) {
              <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-4 rounded-lg flex items-start">
                 <mat-icon class="mr-2 text-red-500 mt-0.5" style="font-size: 20px; width: 20px; height: 20px;">error_outline</mat-icon>
                 {{ errorMessage() }}
              </div>
            }

            @if (successMessage()) {
              <div class="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm p-4 rounded-lg flex items-start">
                 <mat-icon class="mr-2 text-emerald-500 mt-0.5" style="font-size: 20px; width: 20px; height: 20px;">check_circle</mat-icon>
                 {{ successMessage() }}
              </div>
            }

            <div>
              <label for="avatar_url" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL da Foto de Perfil</label>
              <input 
                id="avatar_url" 
                type="url" 
                formControlName="avatar_url" 
                class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none placeholder-slate-400" 
                placeholder="https://suafoto.com/imagem.jpg"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="firstname" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                <input 
                  id="firstname" 
                  type="text" 
                  formControlName="firstname" 
                  class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none placeholder-slate-400" 
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label for="lastname" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sobrenome</label>
                <input 
                  id="lastname" 
                  type="text" 
                  formControlName="lastname" 
                  class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none placeholder-slate-400" 
                  placeholder="Seu sobrenome"
                />
              </div>
            </div>
            
            <div>
              <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Cadastrado</div>
              <div class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 flex items-center cursor-not-allowed">
                <mat-icon class="text-slate-400 mr-2 text-[18px]">lock</mat-icon>
                {{ appUser()?.email }}
              </div>
            </div>

            <div class="pt-4 flex justify-end">
              <button 
                type="submit" 
                [disabled]="profileForm.invalid || isLoading() || !profileForm.dirty"
                class="inline-flex justify-center items-center py-2 px-6 rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                @if (isLoading()) {
                  <span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Salvando...
                } @else {
                  Salvar Alterações
                }
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  private supabase = inject(SupabaseService);
  private fb = inject(FormBuilder);

  appUser = this.supabase.appUser;
  
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  profileForm = this.fb.nonNullable.group({
    firstname: ['', Validators.required],
    lastname: ['', Validators.required],
    avatar_url: ['']
  });

  constructor() {
    effect(() => {
      const user = this.appUser();
      if (user && !this.profileForm.dirty) {
        this.profileForm.patchValue({
          firstname: user.firstname || '',
          lastname: user.lastname || '',
          avatar_url: user.avatar_url || ''
        }, { emitEvent: false });
      }
    });
  }

  async onSubmit() {
    if (this.profileForm.invalid || !this.profileForm.dirty) return;

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const formValue = this.profileForm.getRawValue();
      await this.supabase.updateProfile({
        firstname: formValue.firstname,
        lastname: formValue.lastname,
        avatar_url: formValue.avatar_url
      });
      this.successMessage.set('Perfil atualizado com sucesso!');
      this.profileForm.markAsPristine();
    } catch (e: unknown) {
      console.error(e);
      if (e && typeof e === 'object' && 'code' in e && (e as {code: string}).code === 'PGRST204') {
         this.errorMessage.set('Ops! A coluna "avatar_url" não existe no seu banco Supabase. Rode o comando SQL lá: ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url text;');
      } else {
         this.errorMessage.set('Erro ao atualizar o perfil. Verifique suas permissões.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}

