import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { RoleGuard } from './components/layout/RoleGuard';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Pages
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { ExerciseSessionPage } from './pages/exercise/ExerciseSessionPage';
import { ProgressPage } from './pages/progress/ProgressPage';
import { RecoveryCheckinPage } from './pages/patient/RecoveryCheckinPage';
import { ChatbotPage } from './pages/chatbot/ChatbotPage';
import { SharedReportsPage } from './pages/reports/SharedReportsPage';

// Doctor Portal Pages
import { TherapistDashboard } from './pages/therapist/TherapistDashboard';
import { PatientDetailPage } from './pages/therapist/PatientDetailPage';
import { AssignPlanPage } from './pages/therapist/AssignPlanPage';
import { DoctorProfilePage } from './pages/therapist/DoctorProfilePage';

// Public Layout Wrapper for Landing & Auth
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes with Navbar & Footer */}
          <Route
            path="/"
            element={
              <PublicLayout>
                <LandingPage />
              </PublicLayout>
            }
          />
          <Route
            path="/auth/login"
            element={
              <PublicLayout>
                <LoginPage />
              </PublicLayout>
            }
          />
          <Route
            path="/auth/register"
            element={
              <PublicLayout>
                <RegisterPage />
              </PublicLayout>
            }
          />

          {/* Protected Patient & Caregiver Routes */}
          <Route element={<RoleGuard allowedRoles={['patient', 'caregiver']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<PatientDashboard />} />
              <Route path="/exercise/:id" element={<ExerciseSessionPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/checkins" element={<RecoveryCheckinPage />} />
              <Route path="/chatbot" element={<ChatbotPage />} />
              <Route path="/reports" element={<SharedReportsPage />} />
            </Route>
          </Route>

          {/* Protected Physiotherapist / Doctor Portal */}
          <Route element={<RoleGuard allowedRoles={['physiotherapist']} />}>
            <Route element={<DashboardLayout />}>
              {/* Main dashboard */}
              <Route path="/therapist" element={<TherapistDashboard />} />
              {/* Patient detail view */}
              <Route path="/therapist/patient/:patientId" element={<PatientDetailPage />} />
              {/* Assign exercise plan */}
              <Route path="/therapist/plans/new" element={<AssignPlanPage />} />
              {/* Doctor profile & demo credentials */}
              <Route path="/therapist/profile" element={<DoctorProfilePage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
