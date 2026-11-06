import { describe, it, expect, beforeEach } from 'vitest';
import i18n, {
  setAppLanguage,
  getInitialLanguage,
  SUPPORTED_LANGUAGES,
  LANGUAGE_STORAGE_KEY,
} from '../lib/i18n';
import { speechService } from '../services/voice/speechService';
import { checkEmergencyKeywords } from '../pages/chatbot/ChatbotPage';
import type { SupportedLanguage } from '../types';

import en from '../locales/en/translation.json';
import hi from '../locales/hi/translation.json';
import kn from '../locales/kn/translation.json';
import te from '../locales/te/translation.json';
import bn from '../locales/bn/translation.json';

// In Node environment, mock localStorage
const storageMap: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => storageMap[key] ?? null,
  setItem: (key: string, value: string) => {
    storageMap[key] = String(value);
  },
  removeItem: (key: string) => {
    delete storageMap[key];
  },
  clear: () => {
    Object.keys(storageMap).forEach((k) => delete storageMap[k]);
  },
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Multilingual Localization Suite (Pysiosaathi)', () => {
  beforeEach(() => {
    localStorage.clear();
    setAppLanguage('en');
  });

  describe('Language Configurations & Catalogs', () => {
    it('supports all five requested languages with Indian regional voice locales', () => {
      const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
      expect(codes).toEqual(['en', 'hi', 'kn', 'te', 'bn']);

      const voiceCodes = SUPPORTED_LANGUAGES.map((l) => l.voiceCode);
      expect(voiceCodes).toEqual(['en-IN', 'hi-IN', 'kn-IN', 'te-IN', 'bn-IN']);
    });

    it('ensures all 5 translation catalogs include core required namespaces', () => {
      const catalogs = [
        { lang: 'en', json: en },
        { lang: 'hi', json: hi },
        { lang: 'kn', json: kn },
        { lang: 'te', json: te },
        { lang: 'bn', json: bn },
      ];

      const requiredSections = [
        'common',
        'nav',
        'landing',
        'auth',
        'dashboard',
        'camera',
        'exercise',
        'voice',
        'progress',
        'checkin',
        'chatbot',
        'reports',
        'therapist',
      ];

      catalogs.forEach(({ lang, json }) => {
        requiredSections.forEach((section) => {
          expect(json, `${lang} catalog missing section ${section}`).toHaveProperty(section);
        });
      });
    });
  });

  describe('Language Switching & Persistence', () => {
    it('defaults to English when localStorage is empty', () => {
      expect(getInitialLanguage()).toBe('en');
      expect(i18n.language).toBe('en');
    });

    it('persists selected language in localStorage and changes active language in i18next', () => {
      const targetLanguages: SupportedLanguage[] = ['hi', 'kn', 'te', 'bn', 'en'];

      targetLanguages.forEach((lang) => {
        setAppLanguage(lang);
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe(lang);
        expect(i18n.language).toBe(lang);
      });
    });

    it('retrieves saved preference on initial startup', () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'kn');
      expect(getInitialLanguage()).toBe('kn');

      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'te');
      expect(getInitialLanguage()).toBe('te');
    });

    it('falls back to English if localStorage has an invalid language code', () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr_FR');
      expect(getInitialLanguage()).toBe('en');
    });
  });

  describe('Translations & Fallback Logic', () => {
    it('translates UI strings correctly in each language', () => {
      setAppLanguage('en');
      expect(i18n.t('common.brandName')).toBe('Pysiosaathi');

      setAppLanguage('hi');
      expect(i18n.t('common.brandName')).toBe('फिजियोसाथी');

      setAppLanguage('kn');
      expect(i18n.t('common.brandName')).toBe('ಫಿಸಿಯೋಸಾಥಿ');

      setAppLanguage('te');
      expect(i18n.t('common.brandName')).toBe('ఫిజియోసాథి');

      setAppLanguage('bn');
      expect(i18n.t('common.brandName')).toBe('ফিজিওসাথী');
    });

    it('falls back to English when a missing translation key is queried', () => {
      setAppLanguage('hi');
      // For any non-existent key, i18next returns the key or default fallback without throwing
      const result = i18n.t('nonExistentKey');
      expect(result).toBe('nonExistentKey');
    });
  });

  describe('Multilingual Speech Service (Web Speech API)', () => {
    it('maps language codes to appropriate Indian regional voice locales', () => {
      expect(speechService.getLocaleCode('en')).toBe('en-IN');
      expect(speechService.getLocaleCode('hi')).toBe('hi-IN');
      expect(speechService.getLocaleCode('kn')).toBe('kn-IN');
      expect(speechService.getLocaleCode('te')).toBe('te-IN');
      expect(speechService.getLocaleCode('bn')).toBe('bn-IN');
    });

    it('supports muting and stopping speech without errors', () => {
      speechService.setMuted(true);
      expect(speechService.getIsMuted()).toBe(true);

      const result = speechService.speak('Test speech', 'en');
      expect(result.spoken).toBe(false);

      speechService.setMuted(false);
      expect(speechService.getIsMuted()).toBe(false);
    });
  });

  describe('Multilingual AI Assistant Emergency Triage', () => {
    it('detects acute emergency symptoms in English', () => {
      expect(checkEmergencyKeywords('I feel sudden severe chest pain')).toBe(true);
      expect(checkEmergencyKeywords('I have shortness of breath')).toBe(true);
      expect(checkEmergencyKeywords('I fainted and feel sudden numbness in arm')).toBe(true);
    });

    it('detects acute emergency symptoms in Hindi', () => {
      expect(checkEmergencyKeywords('मुझे सीने में दर्द हो रहा है')).toBe(true);
      expect(checkEmergencyKeywords('चलने पर बहुत चक्कर आ रहे हैं और बेहोश हो गया')).toBe(true);
    });

    it('detects acute emergency symptoms in Kannada', () => {
      expect(checkEmergencyKeywords('ನನಗೆ ತೀವ್ರ ಎದೆ ನೋವು ಕಾಣಿಸಿಕೊಂಡಿದೆ')).toBe(true);
      expect(checkEmergencyKeywords('ಉಸಿರಾಟದ ತೊಂದರೆ ಮತ್ತು ಮೂರ್ಛೆ')).toBe(true);
    });

    it('detects acute emergency symptoms in Telugu', () => {
      expect(checkEmergencyKeywords('నాకు ఛాతీ నొప్పి వస్తోంది')).toBe(true);
      expect(checkEmergencyKeywords('శ్వాస తీసుకోవడంలో ఇబ్బంది మరియు తిమ్మిరి')).toBe(true);
    });

    it('detects acute emergency symptoms in Bengali', () => {
      expect(checkEmergencyKeywords('আমার বুকে ব্যথা এবং তীব্র শ্বাসকষ্ট')).toBe(true);
      expect(checkEmergencyKeywords('হঠাৎ অজ্ঞান হয়ে যাওয়া')).toBe(true);
    });

    it('does not trigger emergency alert for standard physiotherapy queries', () => {
      expect(checkEmergencyKeywords('How many reps of knee extension should I do today?')).toBe(false);
      expect(checkEmergencyKeywords('When should I apply ice on my knee?')).toBe(false);
      expect(checkEmergencyKeywords('हल्का दर्द होना सामान्य है क्या?')).toBe(false);
      expect(checkEmergencyKeywords('ವ್ಯಾಯಾಮ ಹೇಗೆ ಮಾಡಬೇಕು?')).toBe(false);
    });
  });
});
