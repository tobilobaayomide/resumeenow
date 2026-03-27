import { QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PlanProvider } from '../../context/PlanContext';
import { useAuth } from '../../context/useAuth';
import { queryClient } from '../../lib/queryClient';
import Seo from '../seo/Seo';

const ProtectedAppLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;

  return (
    <QueryClientProvider client={queryClient}>
      <PlanProvider>
        <Seo
          title="ResumeeNow Workspace"
          description="Private workspace for building, editing, and exporting resumes inside ResumeeNow."
          path={location.pathname}
          robots="noindex,nofollow"
        />
        <Outlet />
      </PlanProvider>
    </QueryClientProvider>
  );
};

export default ProtectedAppLayout;
