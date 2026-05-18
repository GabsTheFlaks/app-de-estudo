import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDarkMode = signal<boolean>(false);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    this.initTheme();
  }

  private initTheme() {
    if (!isPlatformBrowser(this.platformId)) return;
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.setDarkMode(true);
    } else if (savedTheme === null) {
      // Respeitar preferência do sistema se nenhum tema salvo
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setDarkMode(prefersDark);
    } else {
      this.setDarkMode(false);
    }
  }

  setDarkMode(isDark: boolean) {
    this.isDarkMode.set(isDark);
    if (!isPlatformBrowser(this.platformId)) return;
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  toggleDarkMode() {
    this.setDarkMode(!this.isDarkMode());
  }
}
