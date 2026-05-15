import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

export interface DialogData {
  type: 'confirm' | 'prompt' | 'alert';
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  inputPlaceholder?: string;
  inputDefault?: string;
  danger?: boolean;
}

export interface DialogResult {
  confirmed: boolean;
  value?: string;
}

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm mx-4 p-6 flex flex-col gap-4">

      <!-- Icon + Title -->
      <div class="flex items-start gap-3">
        <div class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          [class]="data.danger
            ? 'bg-red-100 dark:bg-red-900/30'
            : 'bg-indigo-100 dark:bg-indigo-900/30'">
          <mat-icon [class]="data.danger
            ? 'text-red-600 dark:text-red-400'
            : 'text-indigo-600 dark:text-indigo-400'">
            {{ data.danger ? 'warning' : (data.type === 'prompt' ? 'edit' : 'info') }}
          </mat-icon>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-base font-semibold text-slate-800 dark:text-slate-100 leading-snug">
            {{ data.title }}
          </h3>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {{ data.message }}
          </p>
        </div>
      </div>

      <!-- Input (only for prompt) -->
      @if (data.type === 'prompt') {
        <input
          #inputRef
          type="text"
          [(ngModel)]="inputValue"
          [placeholder]="data.inputPlaceholder || ''"
          (keyup.enter)="confirm()"
          class="w-full px-4 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
        />
      }

      <!-- Actions -->
      <div class="flex justify-end gap-2 pt-1">
        @if (data.type !== 'alert') {
          <button
            (click)="cancel()"
            class="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            {{ data.cancelLabel || 'Cancelar' }}
          </button>
        }
        <button
          (click)="confirm()"
          [disabled]="data.type === 'prompt' && !inputValue().trim()"
          [class]="data.danger
            ? 'px-4 py-2 text-sm font-medium rounded-lg transition-colors text-white bg-red-600 hover:bg-red-700 disabled:opacity-50'
            : 'px-4 py-2 text-sm font-medium rounded-lg transition-colors text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50'">
          {{ data.confirmLabel || (data.type === 'alert' ? 'Ok' : 'Confirmar') }}
        </button>
      </div>
    </div>
  `,
})
export class DialogComponent implements OnInit {
  protected data: DialogData = inject(DIALOG_DATA);
  private ref = inject(DialogRef<DialogResult>);

  inputValue = signal(this.data.inputDefault || '');

  ngOnInit() {
    // Close on backdrop click
    this.ref.backdropClick.subscribe(() => this.cancel());
  }

  confirm() {
    if (this.data.type === 'prompt' && !this.inputValue().trim()) return;
    this.ref.close({ confirmed: true, value: this.inputValue() });
  }

  cancel() {
    this.ref.close({ confirmed: false });
  }
}
