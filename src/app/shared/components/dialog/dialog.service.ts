import { Injectable, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { DialogComponent, DialogData, DialogResult } from './dialog.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private dialog = inject(Dialog);

  private open(data: DialogData): Promise<DialogResult> {
    const ref = this.dialog.open<DialogResult>(DialogComponent, {
      data,
      hasBackdrop: true,
      backdropClass: [
        'fixed', 'inset-0',
        'bg-black/40', 'dark:bg-black/60',
        'backdrop-blur-sm', 'z-[1000]'
      ],
      panelClass: [
        'fixed', 'inset-0',
        'flex', 'items-center', 'justify-center',
        'z-[1001]', 'pointer-events-none'
      ],
    });

    return firstValueFrom(ref.closed).then(
      result => result ?? { confirmed: false }
    );
  }

  /** Substitui window.confirm() */
  async confirm(options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
  }): Promise<boolean> {
    const result = await this.open({ type: 'confirm', ...options });
    return result.confirmed;
  }

  /** Substitui window.prompt() */
  async prompt(options: {
    title: string;
    message: string;
    inputPlaceholder?: string;
    inputDefault?: string;
    confirmLabel?: string;
  }): Promise<string | null> {
    const result = await this.open({ type: 'prompt', ...options });
    return result.confirmed ? (result.value ?? '') : null;
  }

  /** Substitui window.alert() */
  async alert(options: {
    title: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
  }): Promise<void> {
    await this.open({ type: 'alert', ...options });
  }
}
