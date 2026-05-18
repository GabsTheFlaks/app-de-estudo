import { TestBed } from '@angular/core/testing';
import { EmbedUrlService } from './embed-url.service';

describe('EmbedUrlService', () => {
  let service: EmbedUrlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmbedUrlService);
  });

  describe('getSafeEmbedUrl', () => {
    it('should convert YouTube watch URL to embed URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const result = service.getSafeEmbedUrl(url);
      expect(result).not.toBeNull();
    });

    it('should convert youtu.be short URL to embed URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      const result = service.getSafeEmbedUrl(url);
      expect(result).not.toBeNull();
    });

    it('should convert Google Drive /view URL to /preview URL', () => {
      const url = 'https://drive.google.com/file/d/abc123/view';
      const result = service.getSafeEmbedUrl(url);
      expect(result).not.toBeNull();
    });

    it('should return null for non-allowed domains', () => {
      const url = 'https://malicious-site.com/embed/dangerous';
      const result = service.getSafeEmbedUrl(url);
      expect(result).toBeNull();
    });

    it('should return null for empty/null URL', () => {
      expect(service.getSafeEmbedUrl('')).toBeNull();
      expect(service.getSafeEmbedUrl(null as unknown as string)).toBeNull();
    });

    it('should return null for javascript: protocol', () => {
      const result = service.getSafeEmbedUrl('javascript:alert(1)');
      expect(result).toBeNull();
    });
  });

  describe('getThumbnailUrl', () => {
    it('should extract YouTube thumbnail from watch URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const thumb = service.getThumbnailUrl(url);
      expect(thumb).toContain('dQw4w9WgXcQ');
      expect(thumb).toContain('img.youtube.com');
    });

    it('should extract Google Drive thumbnail', () => {
      const url = 'https://drive.google.com/file/d/abc123/view';
      expect(service.getThumbnailUrl(url)).toContain('drive.google.com/thumbnail');
    });

    it('should return empty string for undefined/null', () => {
      expect(service.getThumbnailUrl(undefined)).toBe('');
      expect(service.getThumbnailUrl(null as unknown as string)).toBe('');
    });
  });

  describe('getIconForFileType', () => {
    it('should return play_circle for video', () => {
      expect(service.getIconForFileType('video')).toBe('play_circle');
    });

    it('should return picture_as_pdf for pdf', () => {
      expect(service.getIconForFileType('pdf')).toBe('picture_as_pdf');
    });

    it('should return description for docs', () => {
      expect(service.getIconForFileType('docs')).toBe('description');
    });

    it('should return insert_drive_file for unknown types', () => {
      expect(service.getIconForFileType('unknown')).toBe('insert_drive_file');
      expect(service.getIconForFileType(undefined)).toBe('insert_drive_file');
    });
  });

  describe('getBadgeClasses', () => {
    it('should return emerald classes for video', () => {
      expect(service.getBadgeClasses('video')).toContain('emerald');
    });

    it('should return indigo classes for pdf', () => {
      expect(service.getBadgeClasses('pdf')).toContain('indigo');
    });

    it('should return default classes for unknown', () => {
      const result = service.getBadgeClasses('other');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
