import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  ErrorHandler,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { GlobalErrorHandler } from './core/handlers/global-error.handler';
import { DialogModule } from '@angular/cdk/dialog';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    importProvidersFrom(DialogModule),
  ],
};


