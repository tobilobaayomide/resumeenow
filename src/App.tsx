import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import MyResumes from "./components/dashboard/MyResumes";
import Templates from "./components/dashboard/Templates";
import CareerProfile from "./components/dashboard/CareerProfile";
import Settings from "./components/dashboard/Settings";
import BuilderPage from "./components/builder/BuilderPage";

export default function App() {
  return (
    <Router>
              <Toaster position="top-center" richColors />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/myresumes" element={<MyResumes />} />
        <Route path="/dashboard/templates" element={<Templates />} />
        <Route path="/dashboard/profile" element={<CareerProfile />} />
        <Route path="/dashboard/settings" element={<Settings />} />
        {/* Builder page now accepts an ID */}
        <Route path="/builder/:id" element={<BuilderPage />} />
      </Routes>
    </Router>
  );
}