import type { ReactElement } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import MyResumes from "./components/dashboard/MyResumes";
import Templates from "./components/dashboard/Templates";
import CareerProfile from "./components/dashboard/CareerProfile";
import Settings from "./components/dashboard/Settings";
import BuilderPage from "./components/builder/BuilderPage";
import { useAuth } from "./context/AuthContext";

const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  return user ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <Router>
      <Toaster position="top-center" richColors />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/myresumes" element={<ProtectedRoute><MyResumes /></ProtectedRoute>} />
        <Route path="/dashboard/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
        <Route path="/dashboard/profile" element={<ProtectedRoute><CareerProfile /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/builder/:id" element={<ProtectedRoute><BuilderPage /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}
