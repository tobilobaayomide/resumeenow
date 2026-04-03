import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MyResumes = lazy(() => import('./components/dashboard/MyResumes'));
const Templates = lazy(() => import('./components/dashboard/Templates'));
const ProFeatures = lazy(() => import('./components/dashboard/ProFeatures'));
const CareerProfile = lazy(() => import('./components/dashboard/CareerProfile'));
const Settings = lazy(() => import('./components/dashboard/Settings'));
const BuilderPage = lazy(() => import('./components/builder/BuilderPage'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminCampaigns = lazy(() => import('./pages/AdminCampaigns'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminWaitlist = lazy(() => import('./pages/AdminWaitlist'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const ResumePrintPage = lazy(() => import('./pages/ResumePrintPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const DocsPage = lazy(() => import('./pages/DocsPage'));
const DocsDeveloperGuidePage = lazy(() => import('./pages/DocsDeveloperGuidePage'));
const DocsApiReferencePage = lazy(() => import('./pages/DocsApiReferencePage'));
const AppToaster = lazy(() => import('./components/ui/AppToaster'));
const ProtectedAppLayout = lazy(() => import('./components/app/ProtectedAppLayout'));
const AdminRouteLayout = lazy(() => import('./components/app/AdminRouteLayout'));

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
          <Route element={<ProtectedAppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/myresumes" element={<MyResumes />} />
            <Route path="/dashboard/templates" element={<Templates />} />
            <Route path="/dashboard/pro" element={<ProFeatures />} />
            <Route path="/dashboard/profile" element={<CareerProfile />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/builder/:id" element={<BuilderPage />} />
            <Route element={<AdminRouteLayout />}>
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/campaigns" element={<AdminCampaigns />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/waitlist" element={<AdminWaitlist />} />
            </Route>
          </Route>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/doc" element={<DocsPage />} />
          <Route path="/doc/developer-guide" element={<DocsDeveloperGuidePage />} />
          <Route path="/doc/api-reference" element={<DocsApiReferencePage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
