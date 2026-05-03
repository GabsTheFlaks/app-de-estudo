import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-course-image',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="relative w-full h-full bg-indigo-500/10 flex items-center justify-center overflow-hidden">
      @if (hasError()) {
        <div class="flex flex-col items-center justify-center text-center px-4 text-indigo-400/50">
          <mat-icon class="text-4xl mb-2">image_not_supported</mat-icon>
          <span class="text-xs font-bold uppercase tracking-widest">Sem Imagem</span>
          @if (showPreviewWarning()) {
            <span class="text-[10px] mt-2 max-w-xs text-indigo-400/70">Aviso: Imagem inválida. Será usado um placeholder no painel principal.</span>
          }
        </div>
      } @else {
        <img 
          [src]="src()" 
          [alt]="alt()" 
          class="w-full h-full object-cover"
          (error)="hasError.set(true)"
          referrerpolicy="no-referrer"
        />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseImageComponent {
  src = input.required<string>();
  alt = input<string>('');
  showPreviewWarning = input<boolean>(false);
  
  hasError = signal<boolean>(false);
}
