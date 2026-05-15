import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private meta = inject(Meta);
  private title = inject(Title);
  private supabase = inject(SupabaseService);

  setPage(config: {
    title: string;
    description?: string;
    image?: string;
    url?: string;
  }) {
    const fullTitle = `${config.title} — SIMA`;
    this.title.setTitle(fullTitle);

    this.meta.updateTag({ name: 'description', content: config.description ?? '' });
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: config.description ?? '' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });

    if (config.image) {
      this.meta.updateTag({ property: 'og:image', content: config.image });
    }
    if (config.url) {
      this.meta.updateTag({ property: 'og:url', content: config.url });
    }
  }

  /** Call on destroy or navigation to clean up page-specific meta */
  reset() {
    this.setPage({ title: 'SIMA', description: 'Plataforma de estudos online' });
  }
}
