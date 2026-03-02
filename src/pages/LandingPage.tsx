import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import PlansSection from '../components/landing/PlansSection';
import TemplatesSection from '../components/landing/TemplatesSection';
import StepsSection from '../components/landing/StepsSection';
import TrustedSection from '../components/landing/TrustedSection';
import CtaSection from '../components/landing/CtaSection';
import Footer from '../components/landing/Footer';
import AuthModal from '../components/AuthModal';
import type { TemplateId } from '../types/resume';
import type { AuthModalMode } from '../types';

const LandingPage: React.FC = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthModalMode>("login");
  const [pendingTemplate, setPendingTemplate] = useState<TemplateId | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if logged in
  React.useEffect(() => {
    if (user) {
      if (pendingTemplate) {
        navigate(`/builder/new?template=${pendingTemplate}`);
        setPendingTemplate(null);
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
    openAuth('signup');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar
        onLogin={() => openAuth('login')}
        onSignup={() => openAuth('signup')}
      />
      <HeroSection />
      <FeaturesSection />
      <PlansSection />
      <TemplatesSection onSelectTemplate={handleTemplateSelect} />
      <StepsSection />
      <TrustedSection />
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
      <AuthModal
        open={authOpen}
        onClose={() => {
          setAuthOpen(false);
          if (!user) setPendingTemplate(null);
        }}
        mode={authMode}
      />
    </div>
  );
};

export default LandingPage;
