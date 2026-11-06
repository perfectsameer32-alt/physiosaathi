import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES, setAppLanguage } from '../../lib/i18n';
import type { SupportedLanguage } from '../../types';
import { useAuth } from '../../context/useAuth';

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  compact = false,
  className = '',
}) => {
  const { i18n, t } = useTranslation();
  const { user, isDemoMode } = useAuth();

  const currentLang = (i18n.language || 'en').split('-')[0] as SupportedLanguage;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as SupportedLanguage;
    setAppLanguage(newLang);

    // If user is logged in, sync to profile
    if (user) {
      user.preferred_language = newLang;
      if (isDemoMode) {
        localStorage.setItem('pysiosaathi_demo_user', JSON.stringify(user));
      }
    }
  };

  return (
    <div
      className={`language-selector ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        backgroundColor: 'var(--card-bg-subtle)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: compact ? '0.25rem 0.5rem' : '0.35rem 0.65rem',
        transition: 'border-color 0.15s ease',
      }}
    >
      <Globe size={compact ? 14 : 16} style={{ color: 'var(--teal)', flexShrink: 0 }} />
      <label htmlFor="pysiosaathi-language-select" className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }}>
        {t('common.language')}
      </label>
      <select
        id="pysiosaathi-language-select"
        value={currentLang}
        onChange={handleChange}
        aria-label={t('common.language')}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--navy)',
          fontSize: compact ? '0.8125rem' : '0.875rem',
          fontWeight: 500,
          cursor: 'pointer',
          outline: 'none',
          paddingRight: '0.25rem',
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} style={{ backgroundColor: 'var(--white)', color: 'var(--text-primary)' }}>
            {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
    </div>
  );
};
