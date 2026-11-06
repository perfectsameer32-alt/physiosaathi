import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'teal';
  className?: string;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  icon,
  style,
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()} style={style}>
      {icon}
      {children}
    </span>
  );
};
