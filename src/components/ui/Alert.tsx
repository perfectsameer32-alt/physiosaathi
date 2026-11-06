import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  title,
  className = '',
}) => {
  const icons = {
    info: <Info size={18} style={{ color: 'var(--teal)', flexShrink: 0, marginTop: '2px' }} />,
    success: <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />,
    warning: <AlertTriangle size={18} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />,
    error: <AlertCircle size={18} style={{ color: 'var(--error)', flexShrink: 0, marginTop: '2px' }} />,
  };

  return (
    <div className={`alert alert-${variant} ${className}`.trim()} role="alert">
      {icons[variant]}
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'inherit' }}>{title}</div>}
        <div style={{ color: 'inherit' }}>{children}</div>
      </div>
    </div>
  );
};
