import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Course, CourseService } from './course.service';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-viewer-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="h-full flex flex-col bg-white">
      @if (isLoading()) {
        <div class="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
          <mat-icon class="animate-spin text-4xl mb-4 text-indigo-600">loop</mat-icon>
          <span>Carregando material...</span>
        </div>
      } @else if (error() || !course()) {
        <div class="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center max-w-sm mx-auto">
          <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
            <mat-icon class="text-3xl">error_outline</mat-icon>
          </div>
          <h2 class="text-xl font-medium text-slate-800 mb-2">Conteúdo não encontrado</h2>
          <p class="mb-8 text-sm">O curso que você tentou acessar não existe ou houve um problema ao carregá-lo.</p>
          <a routerLink="/dashboard" class="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all text-sm">
            <mat-icon class="mr-2 text-[20px]">arrow_back</mat-icon>
            Voltar ao Dashboard
          </a>
        </div>
      } @else {
        <!-- Viewer Header -->
        <header class="h-14 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0">
          <div class="flex items-center truncate">
            <a [routerLink]="['/course', course()!.id]" class="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors mr-2 flex items-center justify-center">
              <mat-icon>arrow_back</mat-icon>
            </a>
            
            <div class="flex items-center space-x-3 truncate">
              <mat-icon class="text-indigo-600">{{ getIconType(course()!.file_type) }}</mat-icon>
              <h1 class="font-medium text-slate-800 truncate text-lg">Material Principal - {{ course()!.title }}</h1>
            </div>
          </div>
          
          <div class="flex items-center ml-4">
             <button class="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors hidden sm:block">
               <mat-icon>more_vert</mat-icon>
             </button>
          </div>
        </header>

        <!-- Viewer Iframe -->
        <main class="flex-1 bg-slate-50 overflow-hidden relative">
          @if (safeUrl()) {
            <iframe 
              [src]="safeUrl()" 
              class="w-full h-full border-none absolute inset-0"
              allowfullscreen
            ></iframe>
          } @else {
            <div class="absolute inset-0 flex items-center justify-center text-slate-500 bg-slate-50">
               <div class="text-center">
                 <mat-icon class="text-4xl mb-2 text-slate-400">link_off</mat-icon>
                 <p class="text-sm">O link para este material não é suportado.</p>
               </div>
            </div>
          }
        </main>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerPage implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);
  private sanitizer = inject(DomSanitizer);

  course = signal<Course | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<boolean>(false);
  safeUrl = signal<SafeResourceUrl | null>(null);

  async ngOnInit() {
    try {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        const data = await this.courseService.getCourse(id);
        this.course.set(data);
        if (data?.link_drive) {
          let embedUrl = data.link_drive;
          
          if (embedUrl.includes('youtube.com/watch?v=')) {
             embedUrl = embedUrl.replace('watch?v=', 'embed/');
             const ampersandPos = embedUrl.indexOf('&');
             if(ampersandPos !== -1) {
               embedUrl = embedUrl.substring(0, ampersandPos);
             }
          } else if (embedUrl.includes('youtu.be/')) {
             embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
             const qPos = embedUrl.indexOf('?');
             if(qPos !== -1) {
               embedUrl = embedUrl.substring(0, qPos);
             }
          } else if (embedUrl.includes('drive.google.com') && embedUrl.includes('/view')) {
             embedUrl = embedUrl.replace('/view', '/preview');
             const qPos = embedUrl.indexOf('?');
             if(qPos !== -1) {
               embedUrl = embedUrl.substring(0, qPos);
             }
          }
          
          this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl));
        }
      } else {
        this.error.set(true);
      }
    } catch (e) {
      console.error(e);
      this.error.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  getIconType(type: string | undefined): string {
    switch (type) {
      case 'video': return 'play_circle';
      case 'pdf': return 'picture_as_pdf';
      case 'docs': return 'description';
      case 'pptx': return 'slideshow';
      case 'xls': return 'table_chart';
      default: return 'insert_drive_file';
    }
  }

  getBadgeClasses(type: string | undefined): string {
    if (type === 'video') return 'bg-emerald-500 text-slate-900';
    if (type === 'pdf') return 'bg-indigo-500 text-white';
    return 'bg-white/10 text-white border border-white/20 backdrop-blur-sm';
  }
}
