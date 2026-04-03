import type { ReactNode } from 'react';
import { FiArrowLeft, FiLogOut, FiShield, FiUsers } from 'react-icons/fi';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

const ADMIN_NAV_ITEMS = [
  {
    label: 'Overview',
    path: '/admin',
    icon: FiShield,
    exact: true,
  },
  {
    label: 'Users',
    path: '/admin/users',
    icon: FiUsers,
    exact: false,
  },
] as const;

interface AdminLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

const AdminLayout = ({ eyebrow, title, description, children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin';

  return (
    <div className="min-h-screen bg-[#ece6dc] font-sans text-[#111111] md:flex">
      <aside className="hidden w-80 shrink-0 flex-col justify-between border-r border-white/10 bg-[#101010] text-white md:flex">
        <div className="px-8 py-10">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400 transition hover:border-white/20 hover:text-white"
          >
            <FiArrowLeft size={14} />
            Workspace
          </button>

          <div className="mt-10 space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white ring-1 ring-white/10">
              <FiShield size={24} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                {eyebrow}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{title}</h1>
              <p className="mt-4 max-w-sm text-sm leading-7 text-zinc-400">{description}</p>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'border-white/15 bg-white/8 text-white'
                      : 'border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/4 hover:text-white'
                  }`
                }
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
              Safety First
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              This first admin pass is intentionally read-only and structural. User deletion,
              bans, plan changes, and campaign sends should stay behind explicit server-side
              checks when we add them.
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 px-8 py-6">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{displayName}</p>
              <p className="truncate text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                Admin access
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-xl p-2 text-zinc-500 transition hover:bg-white/5 hover:text-red-300"
              aria-label="Sign out"
              title="Sign out"
            >
              <FiLogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1">
        <div className="border-b border-black/5 bg-white/70 px-5 py-4 backdrop-blur md:hidden">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-700"
            >
              <FiArrowLeft size={14} />
              Workspace
            </button>
            <button
              onClick={handleSignOut}
              className="rounded-full border border-black/10 p-2 text-zinc-700"
              aria-label="Sign out"
              title="Sign out"
            >
              <FiLogOut size={16} />
            </button>
          </div>
          <nav className="mt-4 flex flex-wrap gap-2">
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                    isActive
                      ? 'border-black bg-black text-white'
                      : 'border-black/10 bg-white text-zinc-700'
                  }`
                }
              >
                <item.icon size={12} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mx-auto max-w-6xl px-5 py-8 md:px-10 md:py-12">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
