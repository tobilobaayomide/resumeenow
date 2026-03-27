import React, { lazy, Suspense, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import TemplatesSection from '../components/landing/TemplatesSection';
import StepsSection from '../components/landing/StepsSection';
import CtaSection from '../components/landing/CtaSection';
import Footer from '../components/landing/Footer';
import Seo from '../components/seo/Seo';
import { LANDING_PENDING_TEMPLATE_IDS } from '../data/landing';
import type { TemplateId } from '../types/resume';
import type { AuthModalMode } from '../types';
import { buildSeoImageUrl, buildSeoUrl } from '../lib/seo';
import { LEGAL_CONTACT_EMAIL, LEGAL_COMPANY_NAME } from '../data/legal';

const AuthModal = lazy(() => import('../components/AuthModal'));
const PENDING_TEMPLATE_STORAGE_KEY = 'resumeenow:pending-template';
const LANDING_TITLE = 'AI Resume Builder & Resume Parser | ResumeeNow';
const LANDING_DESCRIPTION =
  'Build interview-ready resumes faster with AI-assisted editing, PDF resume parsing, live previews, and export workflows in one focused workspace.';
const LANDING_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: LEGAL_COMPANY_NAME,
      url: buildSeoUrl('/'),
    },
    {
      '@type': 'Organization',
      name: LEGAL_COMPANY_NAME,
      url: buildSeoUrl('/'),
      logo: buildSeoImageUrl('/resumeenowlogo.png'),
      email: LEGAL_CONTACT_EMAIL,
    },
    {
      '@type': 'SoftwareApplication',
      name: LEGAL_COMPANY_NAME,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: buildSeoUrl('/'),
      image: buildSeoImageUrl('/resumeenowlogo.png'),
      description: LANDING_DESCRIPTION,
    },
  ],
};

const readPendingTemplate = (): TemplateId | null => {
  if (typeof window === 'undefined') return null;

  const storedTemplateId = window.sessionStorage.getItem(PENDING_TEMPLATE_STORAGE_KEY);
  if (!storedTemplateId) return null;

  return LANDING_PENDING_TEMPLATE_IDS.includes(storedTemplateId as TemplateId)
    ? (storedTemplateId as TemplateId)
    : null;
};

const syncPendingTemplate = (templateId: TemplateId | null) => {
  if (typeof window === 'undefined') return;

  if (!templateId) {
    window.sessionStorage.removeItem(PENDING_TEMPLATE_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(PENDING_TEMPLATE_STORAGE_KEY, templateId);
};

const LandingPage: React.FC = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthModalMode>("login");
  const [pendingTemplate, setPendingTemplate] = useState<TemplateId | null>(() => readPendingTemplate());
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if logged in
  React.useEffect(() => {
    if (user) {
      const nextTemplate = pendingTemplate ?? readPendingTemplate();

      if (nextTemplate) {
        setPendingTemplate(null);
        syncPendingTemplate(null);
        navigate(`/builder/new?template=${nextTemplate}`);
        return;
      }
      navigate("/dashboard");
    }
  }, [user, navigate, pendingTemplate]);

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleTemplateSelect = (templateId: TemplateId) => {
    if (user) {
      navigate(`/builder/new?template=${templateId}`);
      return;
    }
    setPendingTemplate(templateId);
    syncPendingTemplate(templateId);
    openAuth('signup');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Seo
        title={LANDING_TITLE}
        description={LANDING_DESCRIPTION}
        path="/"
        imageUrl={buildSeoImageUrl('/resumeenowlogo.png')}
        structuredData={LANDING_STRUCTURED_DATA}
      />
      <Navbar
        onLogin={() => openAuth('login')}
        onSignup={() => openAuth('signup')}
      />
      <HeroSection />
      <FeaturesSection />
      <TemplatesSection onSelectTemplate={handleTemplateSelect} />
      <StepsSection />
      <CtaSection
        onPrimaryClick={() => {
          if (user) {
            navigate('/dashboard');
            return;
          }
          openAuth('signup');
        }}
      />
      <Footer />
      <Suspense fallback={null}>
        {authOpen ? (
          <AuthModal
            open={authOpen}
            onClose={(options) => {
              setAuthOpen(false);
              if (!user && !options?.preservePendingTemplate) {
                setPendingTemplate(null);
                syncPendingTemplate(null);
              }
            }}
            mode={authMode}
          />
        ) : null}
      </Suspense>
    </div>
  );
};

export default LandingPage;
