import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ToastService } from '../../shared/services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class StudyToolsService {
  private platformId = inject(PLATFORM_ID);
  private toast = inject(ToastService);

  // --- POMODORO SIGNALS ---
  pomodoroTime = signal<number>(25 * 60);
  pomodoroRunning = signal<boolean>(false);
  pomodoroMode = signal<'work' | 'break'>('work');
  private pomodoroInterval: any = null;

  // --- TTS SIGNALS ---
  ttsSpeaking = signal<boolean>(false);
  ttsPaused = signal<boolean>(false);
  ttsSpeed = signal<number>(1);
  textToSpeak = signal<string | null>(null);
  private utterance: SpeechSynthesisUtterance | null = null;

  // --- POMODORO METHODS ---
  togglePomodoro() {
    if (this.pomodoroRunning()) {
      this.pausePomodoro();
    } else {
      this.startPomodoro();
    }
  }

  startPomodoro() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.pomodoroRunning.set(true);
    this.pomodoroInterval = setInterval(() => {
      if (this.pomodoroTime() > 0) {
        this.pomodoroTime.update(t => t - 1);
      } else {
        this.onPomodoroComplete();
      }
    }, 1000);
  }

  pausePomodoro() {
    this.pomodoroRunning.set(false);
    if (this.pomodoroInterval) {
      clearInterval(this.pomodoroInterval);
      this.pomodoroInterval = null;
    }
  }

  resetPomodoro() {
    this.pausePomodoro();
    this.pomodoroMode.set('work');
    this.pomodoroTime.set(25 * 60);
  }

  private async onPomodoroComplete() {
    this.pausePomodoro();
    await this.playBeep();
    if (this.pomodoroMode() === 'work') {
      this.toast.success('Pomodoro Concluído! Hora do descanso. ☕');
      this.pomodoroMode.set('break');
      this.pomodoroTime.set(5 * 60);
    } else {
      this.toast.success('Hora de voltar ao foco! 📚');
      this.pomodoroMode.set('work');
      this.pomodoroTime.set(25 * 60);
    }
    this.startPomodoro();
  }

  formatPomodoroTime(): string {
    const min = Math.floor(this.pomodoroTime() / 60);
    const sec = this.pomodoroTime() % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  private async playBeep() {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 tone frequency
      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      osc.start();
      osc.stop(ctx.currentTime + 0.35); // Play for 350ms
    } catch (e) {
      console.warn('[Pomodoro] Audio playback blocked by browser policies:', e);
    }
  }

  // --- TTS METHODS ---
  private getPortugueseVoice(): Promise<SpeechSynthesisVoice | undefined> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve(undefined);
    }
    return new Promise(resolve => {
      const synth = window.speechSynthesis;
      const voices = synth.getVoices();

      if (voices.length > 0) {
        resolve(voices.find(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR')));
        return;
      }

      synth.onvoiceschanged = () => {
        const loaded = synth.getVoices();
        resolve(loaded.find(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR')));
      };
    });
  }

  async toggleTTS() {
    if (!isPlatformBrowser(this.platformId)) return;
    const synth = window.speechSynthesis;

    if (this.ttsSpeaking()) {
      synth.cancel();
      this.ttsSpeaking.set(false);
      this.ttsPaused.set(false);
      this.utterance = null;
      return;
    }

    const text = this.textToSpeak();
    if (!text || text.trim() === '') {
      this.toast.info('Não há texto disponível nesta aula para ser narrado.');
      return;
    }

    const ptVoice = await this.getPortugueseVoice();

    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.lang = 'pt-BR';
    this.utterance.rate = this.ttsSpeed();

    if (ptVoice) {
      this.utterance.voice = ptVoice;
    }

    this.utterance.onend = () => {
      this.ttsSpeaking.set(false);
      this.ttsPaused.set(false);
      this.utterance = null;
    };

    this.utterance.onerror = (err) => {
      if (err.error === 'interrupted') return;
      console.warn('[TTS] Erro na leitura:', err);
      this.ttsSpeaking.set(false);
      this.ttsPaused.set(false);
      this.utterance = null;
    };

    this.ttsSpeaking.set(true);
    this.ttsPaused.set(false);
    synth.speak(this.utterance);
  }

  pauseTTS() {
    if (!isPlatformBrowser(this.platformId)) return;
    const synth = window.speechSynthesis;
    if (this.ttsSpeaking() && !this.ttsPaused()) {
      synth.pause();
      this.ttsPaused.set(true);
    }
  }

  resumeTTS() {
    if (!isPlatformBrowser(this.platformId)) return;
    const synth = window.speechSynthesis;
    if (this.ttsSpeaking() && this.ttsPaused()) {
      synth.resume();
      this.ttsPaused.set(false);
    }
  }

  updateTTSSpeed(speed: number) {
    this.ttsSpeed.set(speed);
    if (this.ttsSpeaking()) {
      if (!isPlatformBrowser(this.platformId)) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      this.ttsSpeaking.set(false);
      this.ttsPaused.set(false);
      this.utterance = null;
      this.toggleTTS();
    }
  }
}
