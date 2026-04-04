import type { ReactNode } from 'react';
import {
  FiArrowLeft,
  FiLogOut,
  FiMail,
  FiShield,
  FiStar,
  FiUsers,
} from 'react-icons/fi';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

const ADMIN_NAV_ITEMS = [
  {
    label: 'Overview',
    meta: 'Home',
    path: '/admin',
    icon: FiShield,
    exact: true,
  },
  {
    label: 'Users',
    meta: 'Accounts',
    path: '/admin/users',
    icon: FiUsers,
    exact: false,
  },
  {
    label: 'Campaigns',
    meta: 'Updates',
    path: '/admin/campaigns',
    icon: FiMail,
    exact: false,
  },
  {
    label: 'Waitlist',
    meta: 'Interest',
    path: '/admin/waitlist',
    icon: FiStar,
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
    <div className="min-h-screen bg-[#f5f6f8] font-sans text-[#15120f]">
      <div className="relative min-h-screen lg:grid lg:grid-cols-[21rem_minmax(0,1fr)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(17,24,39,0.08),transparent_52%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(115,115,115,0.08),transparent_60%)]" />
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(15,23,42,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.3)_1px,transparent_1px)] bg-size-[42px_42px]" />
        </div>

        <aside className="relative hidden h-screen flex-col justify-between overflow-hidden border-r border-white/5 bg-[#0f1115] text-white lg:sticky lg:top-0 lg:flex">
          <div className="h-24 flex items-center px-8">
            <div
              className="flex items-center gap-3 cursor-pointer group opacity-90 hover:opacity-100 transition-opacity"
              onClick={() => navigate('/dashboard')}
            >
              <img
                src="/resumeenowlogo.png"
                alt="ResumeeNow logo"
                className="h-6 w-6 object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
              />
              <span className="text-lg font-medium tracking-tight text-white/90">
                Resumee<span className="text-zinc-600">Now.</span>
              </span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
            <div className="space-y-8">
              <div className="space-y-1">
                <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                  Admin
                </p>
                {ADMIN_NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    className={({ isActive }) =>
                      `group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'border-white/10 bg-white/6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                          : 'border-transparent text-zinc-500 hover:bg-white/3 hover:text-zinc-200'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span>
                          <item.icon
                            size={16}
                            className={
                              isActive
                                ? 'text-white'
                                : 'text-zinc-600 transition-colors group-hover:text-zinc-400'
                            }
                          />
                        </span>
                        <span className="flex-1">{item.label}</span>
                        <span className="text-[9px] uppercase tracking-[0.12em] text-zinc-600">
                          {item.meta}
                        </span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5">
            <button
              onClick={() => navigate('/dashboard')}
              className="mb-3 flex w-full items-center gap-3 rounded-xl border border-[#2a2a2a] bg-[#111] px-4 py-3 text-left text-sm font-medium text-zinc-300 transition-all hover:border-[#3a3a3a] hover:text-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white">
                <FiArrowLeft size={16} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate">Back to Workspace</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                  User view
                </span>
              </span>
            </button>

            <div className="group flex items-center justify-between gap-4 rounded-xl border border-[#222] bg-[#111] p-3 transition-all hover:border-[#333]">
              <div className="flex min-w-0 items-center gap-3 overflow-hidden">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-700/50 bg-zinc-800 text-xs font-bold text-zinc-400 transition-colors group-hover:text-white">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-zinc-300 transition-colors group-hover:text-white">
                    {displayName}
                  </p>
                  <p className="mt-1 truncate text-[10px] text-zinc-600">
                    {user?.email?.split('@')[0] || 'internal'}
                  </p>
                  <span className="mt-1 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white">
                    admin
                  </span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-md p-1.5 text-zinc-600 transition-all hover:bg-neutral-900 hover:text-red-400"
                aria-label="Sign out"
                title="Sign out"
              >
                <FiLogOut size={14} />
              </button>
            </div>
          </div>
        </aside>

        <main className="relative min-w-0">
          <div className="sticky top-0 z-20 border-b border-black/10 bg-[#f5f6f8]/90 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-700"
              >
                <FiArrowLeft size={14} />
                Workspace
              </button>
              <button
                onClick={handleSignOut}
                className="rounded-full border border-black/10 bg-white/70 p-2 text-zinc-700"
                aria-label="Sign out"
                title="Sign out"
              >
                <FiLogOut size={16} />
              </button>
            </div>

            <nav className="flex gap-2 overflow-x-auto px-4 pb-4 sm:px-6">
              {ADMIN_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  className={({ isActive }) =>
                    `inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                      isActive
                        ? 'border-black bg-black text-white'
                        : 'border-black/10 bg-white/80 text-zinc-700'
                    }`
                  }
                >
                  <item.icon size={13} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="mx-auto max-w-387.5 px-4 py-5 sm:px-6 lg:px-10 lg:py-10">
            <section className="relative overflow-hidden rounded-[2.25rem] border border-black/8 bg-white/85 px-5 py-6 shadow-[0_26px_80px_-52px_rgba(15,17,21,0.28)] sm:px-6 sm:py-7 lg:px-10 lg:py-10">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(15,23,42,0.08),transparent_54%)]" />
                <div className="absolute bottom-0 left-12 h-32 w-32 rounded-full bg-white/60 blur-3xl" />
              </div>
              <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                  <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-zinc-500">
                    {eyebrow}
                  </p>
                  <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#111111] sm:text-4xl lg:text-[3.4rem]">
                    {title}
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-8 text-zinc-700 sm:text-[15px]">
                    {description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-black/10 bg-[#f7f7f5] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
                    Admin only
                  </span>
                  <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
                    ResumeeNow staff
                  </span>
                </div>
              </div>
            </section>

            <div className="mt-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
