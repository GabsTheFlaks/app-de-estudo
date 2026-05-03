import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-prompt-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatInputModule, FormsModule, MatFormFieldModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
      <mat-form-field appearance="fill" class="w-full mt-4">
        <mat-label>{{ data.label }}</mat-label>
        <input matInput [(ngModel)]="value" (keyup.enter)="onConfirm()">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onDismiss()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="!value" (click)="onConfirm()">Salvar</button>
    </mat-dialog-actions>
  `
})
export class PromptDialogComponent {
  value: string;

  constructor(
    public dialogRef: MatDialogRef<PromptDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string, message: string, label: string, initialValue: string }
  ) {
    this.value = data.initialValue || '';
  }

  onConfirm(): void {
    this.dialogRef.close(this.value);
  }

  onDismiss(): void {
    this.dialogRef.close(null);
  }
}
