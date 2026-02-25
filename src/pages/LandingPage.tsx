import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import TemplatesSection from '../components/landing/TemplatesSection';
import StepsSection from '../components/landing/StepsSection';
import CtaSection from '../components/landing/CtaSection';
import Footer from '../components/landing/Footer';
import AuthModal from '../components/AuthModal';

const LandingPage: React.FC = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if logged in
  React.useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar
        onLogin={() => { setAuthMode("login"); setAuthOpen(true); }}
        onSignup={() => { setAuthMode("signup"); setAuthOpen(true); }}
      />
      <HeroSection />
      <FeaturesSection />
      <TemplatesSection />
      <StepsSection />
      <CtaSection />
      <Footer />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} mode={authMode} />
    </div>
  );
};

export default LandingPage;