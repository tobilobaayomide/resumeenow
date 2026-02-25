import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiX, FiMail, FiLock, FiUser } from "react-icons/fi";
import { AiOutlineApple } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  mode: "login" | "signup";
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, mode }) => {
  const [currentMode, setCurrentMode] = useState<"login" | "signup">(mode);
  const [isAnimating, setIsAnimating] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setCurrentMode(mode);
    setEmail("");
    setPassword("");
    setFullName("");
  }, [mode, open]);

  if (!open) return null;

  const toggleMode = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentMode(prev => prev === "login" ? "signup" : "login");
      setIsAnimating(false);
    }, 200);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (currentMode === 'signup') {
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

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
      // On success, Supabase will redirect and session will be handled globally
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to login with Google";
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        className="relative bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] max-w-105 w-full overflow-hidden border border-white/50 animate-in fade-in zoom-in-95 duration-300"
      >
        <button
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 z-10"
          onClick={onClose}
        >
          <FiX size={20} />
        </button>
        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {currentMode === "login" ? "Welcome Back" : "Create Your Account"}
            </h2>
            <p className="text-gray-500 mt-2 text-sm font-light">
              {currentMode === "login" 
                ? "Enter your details to access your resume." 
                : "Start building your professional career today."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button 
              onClick={handleGoogleLogin}
              type="button"
              className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              <FcGoogle size={20} />
              <span className="text-sm font-medium text-gray-700">Google</span>
            </button>
            <button 
              type="button"
              className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              <AiOutlineApple size={20} />
              <span className="text-sm font-medium text-gray-700">Apple</span>
            </button>
          </div>
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400 font-medium tracking-wider">Or continue with</span>
            </div>
          </div>
          
          <form onSubmit={handleAuth} className={`flex flex-col gap-4 transition-opacity duration-200 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
            {currentMode === "signup" && (
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                  <FiUser size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 border-none rounded-xl py-3 pl-10 pr-4 placeholder-gray-400 focus:ring-2 focus:ring-gray-100 focus:bg-white transition-all duration-200 font-medium text-sm outline-none"
                />
              </div>
            )}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                <FiMail size={18} />
              </div>
              <input
                type="email"
                placeholder="Email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 border-none rounded-xl py-3 pl-10 pr-4 placeholder-gray-400 focus:ring-2 focus:ring-gray-100 focus:bg-white transition-all duration-200 font-medium text-sm outline-none"
              />
            </div>
            <div className="relative group">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                  <FiLock size={18} />
               </div>
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="w-full bg-gray-50 text-gray-900 border-none rounded-xl py-3 pl-10 pr-4 placeholder-gray-400 focus:ring-2 focus:ring-gray-100 focus:bg-white transition-all duration-200 font-medium text-sm outline-none"
              />
            </div>
            {currentMode === "login" && (
                <div className="flex justify-end">
                    <button type="button" className="text-xs font-medium text-gray-500 hover:text-gray-900">
                      Forgot password?
                    </button>
                </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-gray-900 hover:bg-black text-white rounded-xl py-3.5 font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading 
                ? "Processing..." 
                : (currentMode === "login" ? "Sign In" : "Create Account")
              }
            </button>
          </form>
          <div className="mt-8 text-center bg-gray-50 -mx-8 -mb-10 p-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 font-medium">
              {currentMode === "login" ? "Don't have an account?" : "Already have an account?"}
              <button
                className="ml-2 text-gray-900 hover:text-gray-600 font-bold transition-colors"
                onClick={toggleMode}
                disabled={loading}
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
