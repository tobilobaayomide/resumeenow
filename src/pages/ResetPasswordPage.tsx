import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiLock } from "react-icons/fi";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { syncActiveSupabaseSessionToServer } from "../lib/auth/serverSession";
import Seo from "../components/seo/Seo";

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkRecoverySession = async () => {
      const { data: first } = await supabase.auth.getSession();
      if (!mounted) return;

      if (first.session?.user) {
        setCanReset(true);
        setCheckingSession(false);
        return;
      }

      window.setTimeout(async () => {
        const { data: second } = await supabase.auth.getSession();
        if (!mounted) return;
        setCanReset(Boolean(second.session?.user));
        setCheckingSession(false);
      }, 200);
    };

    checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || Boolean(session?.user)) {
        setCanReset(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await syncActiveSupabaseSessionToServer().catch(() => {
        // Keep the password reset flow successful even if server-session sync fails.
      });
      setDone(true);
      toast.success("Password updated successfully.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <Seo
        title="Reset Password | ResumeeNow"
        description="Reset your ResumeeNow account password and regain access to your resume workspace."
        path="/reset-password"
        robots="noindex,nofollow"
      />
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-7 md:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.14)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45 mb-2">
          ResumeNow Access
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Reset your password
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Set a new password for your account. This updates your credentials in your secure auth backend.
        </p>

        {checkingSession ? (
          <p className="text-sm text-gray-500 mt-6">Verifying reset link...</p>
        ) : done ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-center gap-3">
              <span className="w-8 h-7 rounded-full bg-black text-white inline-flex items-center justify-center">
                <FiCheck size={14} />
              </span>
              <p className="text-sm text-gray-700">Password updated. You can continue to your workspace.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="w-full h-11 rounded-xl bg-black text-white text-sm font-semibold hover:bg-zinc-900 transition-colors inline-flex items-center justify-center gap-2"
            >
              Go to Dashboard
            </button>
          </div>
        ) : canReset ? (
          <form onSubmit={handleResetPassword} className="mt-6 space-y-3.5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FiLock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                minLength={6}
                required
                className="w-full bg-gray-50 text-gray-900 border border-transparent rounded-xl py-3 pl-10 pr-4 placeholder-gray-400 focus:ring-2 focus:ring-black/5 focus:border-black/10 focus:bg-white transition-all duration-200 text-sm outline-none"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FiLock size={18} />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                minLength={6}
                required
                className="w-full bg-gray-50 text-gray-900 border border-transparent rounded-xl py-3 pl-10 pr-4 placeholder-gray-400 focus:ring-2 focus:ring-black/5 focus:border-black/10 focus:bg-white transition-all duration-200 text-sm outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-black text-white text-sm font-semibold hover:bg-zinc-900 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-gray-600">
              This reset link is invalid or expired. Request a new one from the login modal.
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full h-11 rounded-xl border border-black/15 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
