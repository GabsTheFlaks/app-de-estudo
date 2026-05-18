import { Injectable } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/** Domínios permitidos para embedding via iframe */
const ALLOWED_EMBED_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'drive.google.com',
  'docs.google.com',
];

@Injectable({
  providedIn: 'root'
})
export class EmbedUrlService {

  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Converte uma URL bruta em uma URL segura para embedding em iframe.
   * Retorna null se a URL não for de um domínio permitido.
   */
  getSafeEmbedUrl(rawUrl: string | null | undefined): SafeResourceUrl | null {
    if (!rawUrl) return null;

    const embedUrl = this.convertToEmbedUrl(rawUrl);
    if (!embedUrl) return null;

    if (!this.isAllowedDomain(embedUrl)) {
      console.warn('[EmbedUrlService] URL bloqueada por não ser de domínio permitido:', rawUrl);
      return null;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  /**
   * Converte URLs do YouTube e Google Drive para formato embed.
   */
  convertToEmbedUrl(url: string): string | null {
    if (!url || url.trim() === '') return null;

    let embedUrl = url.trim();

    try {
      // YouTube: watch URL → embed
      if (embedUrl.includes('youtube.com/watch?v=')) {
        embedUrl = embedUrl.replace('watch?v=', 'embed/');
        const ampersandPos = embedUrl.indexOf('&');
        if (ampersandPos !== -1) {
          embedUrl = embedUrl.substring(0, ampersandPos);
        }
        return embedUrl;
      }

      // YouTube: short URL → embed
      if (embedUrl.includes('youtu.be/')) {
        embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
        const qPos = embedUrl.indexOf('?');
        if (qPos !== -1) {
          embedUrl = embedUrl.substring(0, qPos);
        }
        // Garante https://
        if (!embedUrl.startsWith('http')) {
          embedUrl = 'https://' + embedUrl;
        }
        return embedUrl;
      }

      // Google Drive: view → preview
      if (embedUrl.includes('drive.google.com') && embedUrl.includes('/view')) {
        embedUrl = embedUrl.replace('/view', '/preview');
        const qPos = embedUrl.indexOf('?');
        if (qPos !== -1) {
          embedUrl = embedUrl.substring(0, qPos);
        }
        return embedUrl;
      }

      // URL já é de domínio permitido, retorna diretamente
      if (this.isAllowedDomain(embedUrl)) {
        return embedUrl;
      }

      return null;
    } catch (e) {
      console.warn('[EmbedUrlService] Erro ao processar URL:', e);
      return null;
    }
  }

  /**
   * Converte qualquer link do YouTube (embed, short, etc) de volta para o link original (watch?v=).
   * Útil para o botão "Link Externo".
   */
  getOriginalUrl(url: string | null | undefined): string {
    if (!url) return '';

    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';

        // Caso 1: youtu.be/ID
        if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1].split('?')[0];
        }
        // Caso 2: youtube.com/embed/ID
        else if (url.includes('youtube.com/embed/')) {
          videoId = url.split('youtube.com/embed/')[1].split('?')[0];
        }
        // Caso 3: youtube.com/watch?v=ID
        else if (url.includes('v=')) {
          const urlObj = new URL(url);
          videoId = urlObj.searchParams.get('v') || '';
        }

        if (videoId) {
          return `https://www.youtube.com/watch?v=${videoId}`;
        }
      }
    } catch (e) {
      console.warn('[EmbedUrlService] Erro ao normalizar URL original:', e);
    }

    return url || '';
  }

  /**
   * Extrai thumbnail de URLs do YouTube e Google Drive.
   */
  getThumbnailUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1].split('?')[0];
        } else {
          const urlObj = new URL(url);
          videoId = urlObj.searchParams.get('v') || '';
        }
        if (videoId) return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    } catch (e) {
      console.warn('[EmbedUrlService] URL thumbnail parse error', e);
    }
    return null;
  }

  /**
   * Retorna o ícone Material correspondente ao tipo de arquivo.
   */
  getIconForFileType(type: string | undefined): string {
    switch (type) {
      case 'video': return 'play_circle';
      case 'pdf': return 'picture_as_pdf';
      case 'doc':
      case 'docs': return 'description';
      case 'pptx': return 'slideshow';
      case 'xls': return 'table_chart';
      case 'link': return 'link';
      default: return 'insert_drive_file';
    }
  }

  /**
   * Retorna classes CSS de badge baseadas no tipo de arquivo.
   */
  getBadgeClasses(type: string): string {
    if (type === 'video') return 'bg-emerald-500 text-slate-900';
    if (type === 'pdf') return 'bg-indigo-500 text-white';
    return 'bg-white/10 text-white border border-white/20 backdrop-blur-sm';
  }

  /**
   * Verifica se a URL pertence a um domínio permitido para embedding.
   */
  private isAllowedDomain(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ALLOWED_EMBED_DOMAINS.some(domain => parsed.hostname === domain || parsed.hostname.endsWith('.' + domain));
    } catch {
      return false;
    }
  }
}
