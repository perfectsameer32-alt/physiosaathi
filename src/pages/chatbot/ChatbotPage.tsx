import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Send, Sparkles, PhoneCall, Key, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { geminiService, GEMINI_STORAGE_KEY } from '../../services/ai/geminiService';
import type { ChatMessageHistory, PatientAIContext } from '../../services/ai/geminiService';
import { useAuth } from '../../context/useAuth';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  isEmergencyAlert?: boolean;
  isLoading?: boolean;
}

export const checkEmergencyKeywords = (text: string): boolean => {
  const lower = text.toLowerCase();
  const urgentSignals = [
    // English
    'chest pain', 'shortness of breath', 'cant breathe', 'cannot breathe',
    'fainted', 'blackout', 'paralysis', 'sudden numbness', 'loss of bladder',
    'cauda equina', 'severe dizziness', 'coughing blood',
    // Hindi
    'सीने में दर्द', 'छाती में दर्द', 'सांस लेने में तकलीफ', 'सांस फूलना',
    'बेहोश', 'सुन्न', 'चक्कर',
    // Kannada
    'ಎದೆ ನೋವು', 'ಉಸಿರಾಟದ ತೊಂದರೆ', 'ಉಸಿರು ಕಟ್ಟುವಿಕೆ', 'ಮೂರ್ಛೆ',
    'ಮರಗಟ್ಟುವಿಕೆ', 'ತಲೆಸುತ್ತು',
    // Telugu
    'ఛాతీ నొప్పి', 'శ్వాస తీసుకోవడంలో ఇబ్బంది', 'స్పృహతప్పడం',
    'తిమ్మిరి', 'తలతిరగడం',
    // Bengali
    'বুকে ব্যথা', 'শ্বাসকষ্ট', 'অজ্ঞান', 'অসাড়', 'মাথা ঘোরা',
  ];
  return urgentSignals.some((signal) => lower.includes(signal.toLowerCase()));
};

// Build patient context from auth profile
const buildPatientContext = (user: { full_name?: string; condition?: string } | null): PatientAIContext => ({
  patientName: user?.full_name || 'Patient',
  condition: user?.condition || 'Post-ACL Reconstruction (Week 6 Rehabilitation)',
  prescribedBy: 'Dr. Priya Desai, MPT',
  currentExercises: [
    { name: 'Seated Knee Extension', targetAngle: 165, reps: 10 },
    { name: 'Standing Shoulder Abduction', targetAngle: 90, reps: 12 },
  ],
  recentPainLevel: 2,
  recentAdherence: 88,
});

export const ChatbotPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [emergencyWarning, setEmergencyWarning] = useState<string | null>(null);

  // API key configuration state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeySetup, setShowKeySetup] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [keyMessage, setKeyMessage] = useState('');
  const [apiError, setApiError] = useState<string | null>(geminiService.getLastError());
  const hasApiKey = geminiService.hasApiKey();

  // Keep scrollable chat pinned to bottom
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Conversation history for Gemini multi-turn context (mirrors messages state)
  const historyRef = useRef<ChatMessageHistory[]>([]);

  // Initialize / update greeting on language change
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 0 || (prev.length === 1 && prev[0].id === 'm-initial')) {
        return [{ id: 'm-initial', sender: 'assistant', text: t('chatbot.initialGreeting') }];
      }
      return prev;
    });
  }, [i18n.language, t]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    const isEmergency = checkEmergencyKeywords(userText);

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: userText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Push to history for Gemini context
    historyRef.current.push({ role: 'user', text: userText });

    if (isEmergency) {
      setEmergencyWarning(t('chatbot.emergencyAlertDesc'));
      const alertMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: t('chatbot.emergencyWarningMsg'),
        isEmergencyAlert: true,
      };
      setMessages((prev) => [...prev, alertMsg]);
      historyRef.current.push({ role: 'model', text: t('chatbot.emergencyWarningMsg') });
      return;
    }

    // Show typing indicator
    setIsTyping(true);

    try {
      const patientCtx = buildPatientContext(user as { full_name?: string; condition?: string } | null);
      patientCtx.language = i18n.language;

      // Call Gemini (or fallback)
      const reply = await geminiService.generateResponse(
        historyRef.current.slice(0, -1), // pass history excluding just-added user msg
        userText,
        patientCtx,
        i18n.language
      );

      setApiError(geminiService.getLastError());
      historyRef.current.push({ role: 'model', text: reply });

      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, sender: 'assistant', text: reply },
      ]);
    } catch {
      const fallbackText = t('chatbot.generalAdvice');
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, sender: 'assistant', text: fallbackText },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSaveKey = async () => {
    setKeyStatus('testing');
    setKeyMessage('');
    const result = await geminiService.testConnection(apiKeyInput.trim());
    if (result.success) {
      geminiService.setApiKey(apiKeyInput.trim());
      setApiError(null);
      setKeyStatus('ok');
      setKeyMessage(result.message);
      setTimeout(() => setShowKeySetup(false), 1500);
    } else {
      setKeyStatus('error');
      setKeyMessage(result.message);
    }
  };

  const handleClearKey = () => {
    geminiService.setApiKey('');
    localStorage.removeItem(GEMINI_STORAGE_KEY);
    setApiKeyInput('');
    setKeyStatus('idle');
    setKeyMessage('');
    setApiError(null);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'calc(100vh - 12rem)' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.75rem', margin: 0 }}>{t('chatbot.title')}</h1>
          <Badge variant="teal" icon={<Sparkles size={12} />}>
            {t('chatbot.safetyTriageActive')}
          </Badge>
          {hasApiKey && !apiError ? (
            <Badge variant="success" icon={<CheckCircle size={12} />}>
              Gemini AI Active
            </Badge>
          ) : (
            <Badge variant="neutral" icon={<Bot size={12} />}>
              Clinical Knowledge Base
            </Badge>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{t('chatbot.subtitle')}</p>
          <button
            onClick={() => setShowKeySetup((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '0.3rem 0.75rem',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            title="Configure Gemini API Key"
          >
            <Key size={13} />
            {hasApiKey ? 'API Key Set' : 'Set API Key'}
          </button>
        </div>
      </div>

      {/* API Notice if key could not be verified */}
      {apiError && (
        <Alert variant="warning" title="Gemini AI Key Notice">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem' }}>
              The Gemini API key could not access live models. Operating safely via built-in Clinical Knowledge Base. Click "Update Key" to provide an AI Studio key (starts with AIzaSy).
            </span>
            <Button size="sm" variant="secondary" onClick={() => setShowKeySetup(true)}>
              Update Key
            </Button>
          </div>
        </Alert>
      )}

      {/* API Key Setup Panel */}
      {showKeySetup && (
        <Card style={{ padding: '1rem', background: 'var(--card-bg-subtle)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Key size={15} style={{ color: 'var(--teal)' }} />
              Gemini API Key Configuration
            </span>
            <button onClick={() => setShowKeySetup(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={16} />
            </button>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Enter your <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--teal)' }}>Google AI Studio API key</a> to enable live Gemini responses.
            Without a key, Pysiosaathi uses its built-in clinical knowledge base.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              type="password"
              className="form-input"
              placeholder="AIza…"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              style={{ flex: 1, minWidth: '200px' }}
            />
            <Button
              variant="primary"
              onClick={handleSaveKey}
              disabled={keyStatus === 'testing' || !apiKeyInput.trim()}
            >
              {keyStatus === 'testing' ? 'Testing…' : 'Save & Test'}
            </Button>
            {hasApiKey && (
              <Button variant="secondary" onClick={handleClearKey}>
                Clear Key
              </Button>
            )}
          </div>
          {keyMessage && (
            <p
              style={{
                marginTop: '0.5rem',
                fontSize: '0.8125rem',
                color: keyStatus === 'ok' ? 'var(--success)' : 'var(--error)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              {keyStatus === 'ok' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
              {keyMessage}
            </p>
          )}
        </Card>
      )}

      {/* Emergency Alert Banner */}
      {emergencyWarning && (
        <Alert variant="error" title={t('chatbot.emergencyAlertTitle')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span>{emergencyWarning}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <PhoneCall size={16} />
              <strong>{t('chatbot.nationalEmergencyCall')}</strong>
            </div>
          </div>
        </Alert>
      )}

      {/* Chat Messages Frame */}
      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '0.875rem 1.125rem',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: m.isEmergencyAlert
                      ? 'var(--error-subtle)'
                      : isUser
                      ? 'var(--teal)'
                      : 'var(--card-bg-subtle)',
                    color: m.isEmergencyAlert
                      ? 'var(--error)'
                      : isUser
                      ? 'var(--white)'
                      : 'var(--text-primary)',
                    border: m.isEmergencyAlert
                      ? '1px solid var(--error-border)'
                      : '1px solid var(--border)',
                    fontSize: '0.9375rem',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {!isUser && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        marginBottom: '0.35rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: m.isEmergencyAlert ? 'var(--error)' : 'var(--teal)',
                      }}
                    >
                      <Bot size={14} />
                      <span>{t('chatbot.title')}</span>
                      {hasApiKey && !m.isEmergencyAlert && (
                        <span style={{ opacity: 0.6, fontWeight: 400 }}>· Gemini</span>
                      )}
                    </div>
                  )}
                  {m.text}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--card-bg-subtle)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                }}
              >
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                <span>{t('chatbot.title')} is thinking…</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          style={{
            display: 'flex',
            gap: '0.75rem',
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--divider)',
          }}
        >
          <input
            type="text"
            className="form-input"
            placeholder={t('chatbot.inputPlaceholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
          />
          <Button type="submit" variant="primary" rightIcon={<Send size={15} />} disabled={isTyping || !input.trim()}>
            {t('chatbot.send')}
          </Button>
        </form>
      </Card>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
