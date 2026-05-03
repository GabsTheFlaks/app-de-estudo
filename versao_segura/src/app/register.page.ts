import { ChangeDetectionStrategy, Component, inject, signal, ErrorHandler } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from './supabase.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full place-items-center bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl">

        <div class="mb-10 text-center w-full">
          <h2 class="mt-2 text-3xl font-bold tracking-tight text-white">Cadastre-se</h2>
          <p class="mt-2 text-sm text-slate-400">Crie sua conta para acessar conteúdos</p>
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
                <label for="firstname" class="block text-sm font-medium text-slate-300 mb-1">Nome</label>
                <input
                  id="firstname"
                  type="text"
                  formControlName="firstname"
                  class="w-full px-4 py-3 bg-black/20 rounded-xl border border-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none text-white placeholder-slate-500"
                  placeholder="Nome"
                />
              </div>
              <div class="w-1/2">
                <label for="lastname" class="block text-sm font-medium text-slate-300 mb-1">Sobrenome</label>
                <input
                  id="lastname"
                  type="text"
                  formControlName="lastname"
                  class="w-full px-4 py-3 bg-black/20 rounded-xl border border-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none text-white placeholder-slate-500"
                  placeholder="Sobrenome"
                />
              </div>
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-slate-300 mb-1">E-mail</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="w-full px-4 py-3 bg-black/20 rounded-xl border border-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none text-white placeholder-slate-500"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-slate-300 mb-1">Senha</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                class="w-full px-4 py-3 bg-black/20 rounded-xl border border-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none text-white placeholder-slate-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              [disabled]="registerForm.invalid || isLoading()"
              class="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/20 text-sm font-bold text-white bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
            <span class="text-sm text-slate-400">Já tem uma conta? </span>
            <a routerLink="/login" class="text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors hover:underline">Entre</a>
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
    if (this.registerForm.invalid || this.isLoading()) return;

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
        this.errorMessage.set(error.message);
      } else if (data.user) {
         // O profile é criado automaticamente via Database Trigger (ver SUPABASE_SETUP.md)
         this.router.navigate(['/dashboard']);
      }
    } catch (e) {
      inject(ErrorHandler).handleError(e);
      this.errorMessage.set('Erro inexperado. Tente novamente.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
