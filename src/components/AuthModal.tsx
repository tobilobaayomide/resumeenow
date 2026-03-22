import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiX, FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiGithub } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import type { AuthModalMode, AuthModalProps, OAuthProvider } from "../types/ui";

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, mode }) => {
  const oauthEnabled = false;
  const [currentMode, setCurrentMode] = useState<AuthModalMode>(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setCurrentMode(mode);
    setEmail("");
    setPassword("");
    setFullName("");
    setShowPassword(false);
  }, [mode, open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const toggleMode = () => {
    setCurrentMode((prev) => (prev === "login" ? "signup" : "login"));
    setPassword("");
    setShowPassword(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (currentMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;

        if (data.session) {
          toast.success("Account created successfully!");
          onClose();
          navigate("/dashboard");
          return;
        }

        toast.success("Success! Check your email for the confirmation link.");
        onClose();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Successfully logged in!");
        onClose();
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setOauthLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `Failed to login with ${provider}`;
      toast.error(message);
    } finally {
      setOauthLoading(null);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error("Enter your email first, then tap Forgot password.");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent. Check your inbox.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send reset link";
      toast.error(message);
    }
  };

  const closeModal = () => {
    if (loading || oauthLoading) return;
    onClose();
  };

  const isBusy = loading || oauthLoading !== null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeModal}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        aria-describedby="auth-modal-description"
        className="relative w-full max-w-105 overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_28px_70px_rgba(0,0,0,0.25)] animate-in fade-in zoom-in-95 duration-300"
      >
        <button
          type="button"
          aria-label="Close auth modal"
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 z-10 disabled:opacity-50"
          onClick={closeModal}
          disabled={isBusy}
        >
          <FiX size={20} />
        </button>

        <div className="p-7 md:p-8">
          <div className="text-center mb-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45 mb-2">
              ResumeNow Access
            </p>
            <h2 id="auth-modal-title" className="text-2xl font-semibold text-gray-900 tracking-tight">
              {currentMode === "login" ? "Welcome Back" : "Create Your Account"}
            </h2>
            <p id="auth-modal-description" className="text-gray-500 mt-2 text-sm font-light">
              {currentMode === "login"
                ? "Sign in to continue editing and exporting your resume."
                : "Start your workspace and build job-ready resumes faster."}
            </p>
          </div>

          {oauthEnabled ? (
            <>
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                <button
                  onClick={() => handleOAuthLogin("google")}
                  type="button"
                  disabled={isBusy}
                  className="h-11 flex items-center justify-center gap-2 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FcGoogle size={19} />
                  <span className="text-sm font-medium text-gray-700">
                    {oauthLoading === "google" ? "Connecting..." : "Google"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuthLogin("github")}
                  disabled={isBusy}
                  className="h-11 flex items-center justify-center gap-2 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FiGithub size={19} />
                  <span className="text-sm font-medium text-gray-700">
                    {oauthLoading === "github" ? "Connecting..." : "GitHub"}
                  </span>
                </button>
              </div>

              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-400 font-medium tracking-wider">Or continue with email</span>
                </div>
              </div>
            </>
          ) : null}

          <form key={currentMode} onSubmit={handleAuth} className="flex flex-col gap-3.5 animate-in fade-in duration-200">
            {currentMode === "signup" && (
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                  <FiUser size={18} />
                </div>
                <input
                  id="auth-full-name"
                  name="full_name"
                  type="text"
                  placeholder="Full name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 border border-transparent rounded-xl py-3 pl-10 pr-4 placeholder-gray-400 focus:ring-2 focus:ring-black/5 focus:border-black/10 focus:bg-white transition-all duration-200 font-medium text-sm outline-none"
                />
              </div>
            )}

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                <FiMail size={18} />
              </div>
              <input
                id="auth-email"
                name="email"
                type="email"
                placeholder="Email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 border border-transparent rounded-xl py-3 pl-10 pr-4 placeholder-gray-400 focus:ring-2 focus:ring-black/5 focus:border-black/10 focus:bg-white transition-all duration-200 font-medium text-sm outline-none"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                <FiLock size={18} />
              </div>
              <input
                id="auth-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="w-full bg-gray-50 text-gray-900 border border-transparent rounded-xl py-3 pl-10 pr-10 placeholder-gray-400 focus:ring-2 focus:ring-black/5 focus:border-black/10 focus:bg-white transition-all duration-200 font-medium text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-700 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
              </button>
            </div>

            {currentMode === "login" && (
              <div className="flex justify-end -mt-0.5">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isBusy}
                  className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isBusy}
              className="mt-1 bg-black hover:bg-zinc-900 text-white rounded-xl py-3.5 font-semibold text-sm transition-all duration-200 shadow-[0_14px_30px_rgba(0,0,0,0.24)] hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : (currentMode === "login" ? "Sign In" : "Create Account")}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {currentMode === "login" ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                className="ml-2 text-gray-900 hover:text-gray-600 font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={toggleMode}
                disabled={isBusy}
              >
                {currentMode === "login" ? "Sign Up" : "Log In"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
