import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { INITIAL_MOCK_SHARES } from '../../lib/mockData';
import type { ReportShare } from '../../types';
import { Plus, Trash2, Key } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';

export const SharedReportsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [shares, setShares] = useState<ReportShare[]>(INITIAL_MOCK_SHARES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientRole, setRecipientRole] = useState<'physiotherapist' | 'family' | 'doctor'>('physiotherapist');
  const [accessLevel, setAccessLevel] = useState<'summary_only' | 'full_telemetry'>('summary_only');
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleRevoke = (id: string) => {
    setShares((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_revoked: true } : s))
    );
  };

  const handleCreateShare = (e: React.FormEvent) => {
    e.preventDefault();
    const newShare: ReportShare = {
      id: `share-${Date.now()}`,
      patient_id: 'demo-patient-001',
      recipient_name: recipientName,
      recipient_email: recipientEmail,
      recipient_role: recipientRole,
      access_level: accessLevel,
      share_token: `tok_${Math.random().toString(36).substring(2, 9)}`,
      is_revoked: false,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    setShares((prev) => [newShare, ...prev]);
    setShareSuccess(true);
    setTimeout(() => {
      setShareSuccess(false);
      setIsModalOpen(false);
      setRecipientName('');
      setRecipientEmail('');
    }, 1200);
  };

  const locale = i18n.language === 'en' ? 'en-IN' : i18n.language;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{t('reports.title')}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {t('reports.subtitle')}
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsModalOpen(true)} leftIcon={<Plus size={16} />}>
          {t('reports.createShareBtn')}
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {shares.map((share) => (
          <Card key={share.id} style={{ opacity: share.is_revoked ? 0.65 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '1.0625rem', color: 'var(--navy)' }}>
                    {share.recipient_name}
                  </span>
                  <Badge variant={share.is_revoked ? 'error' : 'teal'}>
                    {share.is_revoked ? t('reports.accessRevoked') : t('reports.activeAuthorization')}
                  </Badge>
                  <Badge variant="neutral">
                    {share.access_level === 'full_telemetry' ? t('reports.fullTelemetry') : t('reports.summaryOnly')}
                  </Badge>
                </div>

                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Email: {share.recipient_email} • Role: {share.recipient_role}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Key size={13} />
                  <span>{t('reports.secureToken')}: <code>{share.share_token}</code></span>
                  <span>• {t('reports.validUntil')} {new Date(share.expires_at).toLocaleDateString(locale)}</span>
                </div>
              </div>

              {!share.is_revoked && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(share.id)}
                  leftIcon={<Trash2 size={14} style={{ color: 'var(--error)' }} />}
                  style={{ color: 'var(--error)' }}
                >
                  {t('reports.revokeAccess')}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Modal: Create Share Invitation */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('reports.modalTitle')}
        description={t('reports.modalDesc')}
      >
        {shareSuccess ? (
          <Alert variant="success" title={t('reports.shareCreated')}>
            The secure progress link has been created and registered in your active shares list.
          </Alert>
        ) : (
          <form onSubmit={handleCreateShare}>
            <div className="form-group">
              <label className="form-label">{t('reports.recipientName')}</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Dr. Priya Desai or Meera Sharma"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('reports.recipientEmail')}</label>
              <input
                type="email"
                className="form-input"
                placeholder="physio@clinic.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('reports.recipientRole')}</label>
              <select
                className="form-select"
                value={recipientRole}
                onChange={(e) => setRecipientRole(e.target.value as any)}
              >
                <option value="physiotherapist">{t('common.physiotherapist')}</option>
                <option value="family">{t('common.caregiver')}</option>
                <option value="doctor">{t('common.doctor')}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('reports.permittedScope')}</label>
              <select
                className="form-select"
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as any)}
              >
                <option value="summary_only">{t('reports.summaryOnly')}</option>
                <option value="full_telemetry">{t('reports.fullTelemetry')}</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="primary">
                {t('reports.issueShare')}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
