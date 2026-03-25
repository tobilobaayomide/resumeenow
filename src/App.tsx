import { lazy, Suspense, type ReactElement } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/useAuth';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MyResumes = lazy(() => import('./components/dashboard/MyResumes'));
const Templates = lazy(() => import('./components/dashboard/Templates'));
const ProFeatures = lazy(() => import('./components/dashboard/ProFeatures'));
const CareerProfile = lazy(() => import('./components/dashboard/CareerProfile'));
const Settings = lazy(() => import('./components/dashboard/Settings'));
const BuilderPage = lazy(() => import('./components/builder/BuilderPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const ResumePrintPage = lazy(() => import('./pages/ResumePrintPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const AppToaster = lazy(() => import('./components/ui/AppToaster'));

const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  return user ? children : <Navigate to="/" replace />;
};

const AppFallback = () => <div className="h-screen bg-white" />;

export default function App() {
  return (
    <Router>
      <Suspense fallback={null}>
        <AppToaster />
      </Suspense>
      <Suspense fallback={<AppFallback />}>
        <Routes>
          <Route path="/print/resume" element={<ResumePrintPage />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/myresumes" element={<ProtectedRoute><MyResumes /></ProtectedRoute>} />
          <Route path="/dashboard/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
          <Route path="/dashboard/pro" element={<ProtectedRoute><ProFeatures /></ProtectedRoute>} />
          <Route path="/dashboard/profile" element={<ProtectedRoute><CareerProfile /></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/builder/:id" element={<ProtectedRoute><BuilderPage /></ProtectedRoute>} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
