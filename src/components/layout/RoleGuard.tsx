import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

interface RoleGuardProps {
  allowedRoles?: UserRole[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--off-white)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              border: '3px solid var(--border)',
              borderTopColor: 'var(--teal)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Verifying secure session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If physiotherapist accidentally navigates to patient dashboard or vice-versa
    if (user.role === 'physiotherapist') {
      return <Navigate to="/therapist" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
