import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    console.error('An unexpected error occurred:', error);
    // Here we can integrate with a monitoring service or display a global snackbar
    // for instance:
    // const snackBar = this.injector.get(MatSnackBar);
    // snackBar.open('Ocorreu um erro inesperado', 'Fechar', { duration: 3000 });
  }
}
