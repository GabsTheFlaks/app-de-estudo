import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-50 dark:bg-[#0f172a]">
      <!-- Background SVG Pattern (Dots) -->
      <div class="absolute inset-0 z-0 opacity-40 dark:opacity-20" style="background-image: url('data:image/svg+xml,%3Csvg width=\\'20\\' height=\\'20\\' viewBox=\\'0 0 20 20\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'%236366f1\\' fill-opacity=\\'0.4\\' fill-rule=\\'evenodd\\'%3E%3Ccircle cx=\\'3\\' cy=\\'3\\' r=\\'3\\'/%3E%3C/g%3E%3C/svg%3E'); mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%); -webkit-mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);"></div>
      
      <!-- Glowing Orbs -->
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 dark:bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/20 dark:bg-emerald-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div class="max-w-md w-full bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-10 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-2xl relative z-10">
        
        <div class="mb-10 text-center w-full">
          <h2 class="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Cadastre-se</h2>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Crie sua conta para acessar conteúdos</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="w-full space-y-6">
          @if (errorMessage()) {
            <div class="bg-red-500/10 text-red-400 text-sm p-3 rounded-xl border border-red-500/20">
              {{ errorMessage() }}
            </div>
          }
          
          <div class="space-y-4">
            <div class="flex gap-4">
              <div class="w-1/2">
                <label for="firstname" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                <input 
                  id="firstname" 
                  type="text" 
                  formControlName="firstname" 
                  class="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm" 
                  placeholder="Nome"
                />
              </div>
              <div class="w-1/2">
                <label for="lastname" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sobrenome</label>
                <input 
                  id="lastname" 
                  type="text" 
                  formControlName="lastname" 
                  class="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm" 
                  placeholder="Sobrenome"
                />
              </div>
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
              <input 
                id="email" 
                type="email" 
                formControlName="email" 
                class="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm" 
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
              <input 
                id="password" 
                type="password" 
                formControlName="password" 
                class="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm" 
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button 
              type="submit" 
              [disabled]="registerForm.invalid || isLoading()"
              class="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/30 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              @if (isLoading()) {
                <span class="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
                Criando conta...
              } @else {
                Cadastrar
              }
            </button>
          </div>
          
          <div class="text-center mt-4">
            <span class="text-sm text-slate-500 dark:text-slate-400">Já tem uma conta? </span>
            <a routerLink="/login" class="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors hover:underline">Entre</a>
          </div>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal('');

  registerForm = this.fb.nonNullable.group({
    firstname: ['', Validators.required],
    lastname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password, firstname, lastname } = this.registerForm.getRawValue();

    try {
      const { data, error } = await this.supabase.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstname,
            lastname
          }
        }
      });

      if (error) {
        console.error('Erro no registro:', error);
        this.errorMessage.set('Não foi possível criar a conta. Verifique os dados e tente novamente.');
      } else if (data.user) {
         // O profile é criado automaticamente via Database Trigger (ver SUPABASE_SETUP.md)
         this.router.navigate(['/dashboard']);
      }
    } catch (e) {
      console.error(e);
      this.errorMessage.set('Erro inexperado. Tente novamente.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
