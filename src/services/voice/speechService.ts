import type { SupportedLanguage } from '../../types';

class MultilingualSpeechService {
  private isMuted: boolean = false;
  private lastSpokenTime: number = 0;
  private minCooldownMs: number = 2500; // Prevent repetitive spamming on video frames
  private availableVoices: SpeechSynthesisVoice[] = [];
  private voicesLoaded: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.availableVoices = window.speechSynthesis.getVoices();
    if (this.availableVoices.length > 0) {
      this.voicesLoaded = true;
    }
  }

  public getLocaleCode(lang: SupportedLanguage | string): string {
    const code = (lang || 'en').split('-')[0] as SupportedLanguage;
    const map: Record<SupportedLanguage, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      kn: 'kn-IN',
      te: 'te-IN',
      bn: 'bn-IN',
    };
    return map[code] || 'en-IN';
  }

  public findBestVoice(lang: SupportedLanguage | string): { voice: SpeechSynthesisVoice | null; isExact: boolean } {
    if (!this.voicesLoaded) {
      this.initVoices();
    }

    const targetLocale = this.getLocaleCode(lang);
    const primaryLangPrefix = (lang || 'en').toLowerCase().split('-')[0];

    // 1. Exact locale match (e.g. 'hi-IN')
    const exact = this.availableVoices.find((v) => v.lang.toLowerCase() === targetLocale.toLowerCase());
    if (exact) {
      return { voice: exact, isExact: true };
    }

    // 2. Prefix match (e.g. starts with 'hi')
    const prefixMatch = this.availableVoices.find((v) => v.lang.toLowerCase().startsWith(primaryLangPrefix));
    if (prefixMatch) {
      return { voice: prefixMatch, isExact: true };
    }

    // 3. Fallback to default or English voice
    const fallback = this.availableVoices.find((v) => v.default) || this.availableVoices[0] || null;
    return { voice: fallback, isExact: false };
  }

  public speak(
    text: string,
    lang: SupportedLanguage | string = 'en',
    force: boolean = false
  ): { spoken: boolean; fallbackUsed: boolean } {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return { spoken: false, fallbackUsed: false };
    }

    if (this.isMuted && !force) {
      return { spoken: false, fallbackUsed: false };
    }

    const now = performance.now();
    if (!force && now - this.lastSpokenTime < this.minCooldownMs) {
      return { spoken: false, fallbackUsed: false };
    }

    try {
      window.speechSynthesis.cancel(); // Stop preceding message if queued
      const utterance = new SpeechSynthesisUtterance(text);
      const targetLocale = this.getLocaleCode(lang);
      utterance.lang = targetLocale;
      utterance.rate = 0.95; // Slightly slower, clear healthcare pacing
      utterance.pitch = 1.0;

      const { voice, isExact } = this.findBestVoice(lang);
      if (voice) {
        utterance.voice = voice;
      }

      this.lastSpokenTime = now;
      window.speechSynthesis.speak(utterance);
      return { spoken: true, fallbackUsed: !isExact };
    } catch {
      return { spoken: false, fallbackUsed: false };
    }
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const speechService = new MultilingualSpeechService();
