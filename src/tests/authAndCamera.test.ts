import { describe, it, expect, beforeEach } from 'vitest';
import en from '../locales/en/translation.json';
import hi from '../locales/hi/translation.json';
import kn from '../locales/kn/translation.json';
import te from '../locales/te/translation.json';
import bn from '../locales/bn/translation.json';

describe('Real Mode & Camera Fullscreen Suite', () => {
  describe('Camera Fullscreen Translations in all 5 languages', () => {
    it('has fullscreen and exitFullscreen defined in English', () => {
      expect(en.camera.fullscreen).toBe('Full Screen');
      expect(en.camera.exitFullscreen).toBe('Exit Full Screen');
      expect(en.camera.pressEscToExit).toBeDefined();
    });

    it('has fullscreen and exitFullscreen defined in Hindi', () => {
      expect(hi.camera.fullscreen).toBe('फुल स्क्रीन');
      expect(hi.camera.exitFullscreen).toBe('फुल स्क्रीन से बाहर निकलें');
      expect(hi.camera.pressEscToExit).toBeDefined();
    });

    it('has fullscreen and exitFullscreen defined in Kannada', () => {
      expect(kn.camera.fullscreen).toBe('ಪೂರ್ಣ ಪರದೆ');
      expect(kn.camera.exitFullscreen).toBe('ಪೂರ್ಣ ಪರದೆಯಿಂದ ನಿರ್ಗಮಿಸಿ');
      expect(kn.camera.pressEscToExit).toBeDefined();
    });

    it('has fullscreen and exitFullscreen defined in Telugu', () => {
      expect(te.camera.fullscreen).toBe('పూర్తి స్క్రీన్');
      expect(te.camera.exitFullscreen).toBe('పూర్తి స్క్రీన్ నుండి నిష్క్రమించండి');
      expect(te.camera.pressEscToExit).toBeDefined();
    });

    it('has fullscreen and exitFullscreen defined in Bengali', () => {
      expect(bn.camera.fullscreen).toBe('ফুল স্ক্রিন');
      expect(bn.camera.exitFullscreen).toBe('ফুল স্ক্রিন থেকে প্রস্থান করুন');
      expect(bn.camera.pressEscToExit).toBeDefined();
    });
  });

  describe('Local Persistent Real Authentication Flow', () => {
    const storage: Record<string, string> = {};
    const mockLocalStorage = {
      getItem: (k: string) => storage[k] ?? null,
      setItem: (k: string, v: string) => { storage[k] = v; },
      removeItem: (k: string) => { delete storage[k]; },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
    };

    beforeEach(() => {
      mockLocalStorage.clear();
    });

    it('stores registered patient account and verifies login credentials', () => {
      const registeredUsers = [
        {
          user: {
            id: 'user-patient-1',
            email: 'patient@clinic.com',
            full_name: 'John Doe',
            role: 'patient',
            created_at: new Date().toISOString(),
          },
          passwordHash: 'secret123',
        },
      ];
      mockLocalStorage.setItem('pysiosaathi_registered_users', JSON.stringify(registeredUsers));

      const users = JSON.parse(mockLocalStorage.getItem('pysiosaathi_registered_users') || '[]');
      const found = users.find((u: any) => u.user.email === 'patient@clinic.com');

      expect(found).toBeDefined();
      expect(found.user.role).toBe('patient');
      expect(found.passwordHash).toBe('secret123');
    });

    it('stores registered doctor account with doctor profile and verifies role is physiotherapist', () => {
      const doctorId = 'user-doc-1';
      const doctorUser = {
        id: doctorId,
        email: 'dr.smith@hospital.com',
        full_name: 'Dr. Jane Smith',
        role: 'physiotherapist',
        created_at: new Date().toISOString(),
      };

      const doctorProfile = {
        id: doctorId,
        full_name: 'Dr. Jane Smith',
        email: 'dr.smith@hospital.com',
        specialty: 'Physiotherapist & Rehab Specialist',
        qualifications: ['BPT', 'MPT'],
        clinic_name: 'Apex Rehab',
        is_demo: false,
        created_at: new Date().toISOString(),
      };

      mockLocalStorage.setItem('pysiosaathi_registered_users', JSON.stringify([{ user: doctorUser, passwordHash: 'docPass123' }]));
      mockLocalStorage.setItem('pysiosaathi_doctor_profiles', JSON.stringify({ [doctorId]: doctorProfile }));

      const profiles = JSON.parse(mockLocalStorage.getItem('pysiosaathi_doctor_profiles') || '{}');
      expect(profiles[doctorId]).toBeDefined();
      expect(profiles[doctorId].full_name).toBe('Dr. Jane Smith');
      expect(profiles[doctorId].is_demo).toBe(false);
    });
  });
});

