import { ChangeDetectionStrategy, Component, inject, signal, ErrorHandler } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from './supabase.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full place-items-center bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl">

        <div class="mb-10 text-center w-full">
          <h2 class="mt-2 text-3xl font-bold tracking-tight text-white">Bem-vindo</h2>
          <p class="mt-2 text-sm text-slate-400">Faça login para acessar seus cursos</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="w-full space-y-6">
          @if (errorMessage()) {
            <div class="bg-red-500/10 text-red-400 text-sm p-3 rounded-xl border border-red-500/20">
              {{ errorMessage() }}
            </div>
          }

          <div class="space-y-4">
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
              [disabled]="loginForm.invalid || isLoading()"
              class="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/20 text-sm font-bold text-white bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              @if (isLoading()) {
                <span class="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
                Entrando...
              } @else {
                Entrar
              }
            </button>
          </div>

          <div class="text-center mt-4">
            <span class="text-sm text-slate-400">Não tem uma conta? </span>
            <a routerLink="/register" class="text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors hover:underline">Cadastre-se</a>
          </div>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal('');

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  async onSubmit() {
    if (this.loginForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.getRawValue();

    try {
      const { error } = await this.supabase.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        this.errorMessage.set('E-mail ou senha incorretos.');
      } else {
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
