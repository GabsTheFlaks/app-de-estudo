import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ToastService } from '../../shared/services/toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  // Lazy inject to avoid circular dependency during bootstrap
  private get toast(): ToastService {
    return inject(ToastService);
  }

  handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);

    // Ignore known Angular internal errors that are not user-facing
    const ignoredPatterns = [
      'ExpressionChangedAfterItHasBeenCheckedError',
      'NG0100',
      'ResizeObserver loop',
    ];

    const isIgnored = ignoredPatterns.some(p => message.includes(p));
    if (isIgnored) {
      console.warn('[GlobalErrorHandler] Suppressed known error:', message);
      return;
    }

    console.error('[GlobalErrorHandler]', error);

    try {
      this.toast.error('Ocorreu um erro inesperado. Tente novamente.');
    } catch {
      // ToastService may not be available during bootstrap errors
    }
  }
}
