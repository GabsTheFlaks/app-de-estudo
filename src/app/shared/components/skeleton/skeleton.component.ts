import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [class]="'animate-pulse rounded-' + radius + ' bg-slate-200 dark:bg-slate-700 ' + cssClass"
      [style.width]="width"
      [style.height]="height"
    ></div>
  `,
})
export class SkeletonComponent {
  @Input() width = '100%';
  @Input() height = '1rem';
  @Input() radius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
  @Input() cssClass = '';
}
