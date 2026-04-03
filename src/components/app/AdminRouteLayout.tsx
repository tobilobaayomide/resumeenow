import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCurrentUserRole } from '../../hooks/useCurrentUserRole';
import Seo from '../seo/Seo';

const AdminRouteLayout = () => {
  const location = useLocation();
  const { isAdmin, loading } = useCurrentUserRole();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111111] px-6 text-center font-sans text-sm uppercase tracking-[0.18em] text-zinc-500">
        Checking admin access
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Seo
        title="ResumeeNow Admin"
        description="Internal admin console for ResumeeNow operations."
        path={location.pathname}
        robots="noindex,nofollow"
      />
      <Outlet />
    </>
  );
};

export default AdminRouteLayout;
