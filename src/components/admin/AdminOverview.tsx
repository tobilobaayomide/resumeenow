import {
  FiBell,
  FiMail,
  FiShield,
  FiStar,
  FiUsers,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import AdminLayout from './AdminLayout';

interface AdminSurface {
  title: string;
  description: string;
  icon: IconType;
  status: string;
}

const ADMIN_SURFACES: AdminSurface[] = [
  {
    title: 'Users',
    description:
      'List accounts, inspect state, and later add explicit suspend or delete flows through protected server routes.',
    icon: FiUsers,
    status: 'Next build',
  },
  {
    title: 'Campaigns',
    description:
      'Compose product updates once, then send them as email and in-app notifications without writing code each time.',
    icon: FiMail,
    status: 'Next build',
  },
  {
    title: 'Waitlist',
    description:
      'Review Pro waitlist joins, filter recent interest, and prepare targeted follow-up when pricing or launches change.',
    icon: FiStar,
    status: 'Next build',
  },
  {
    title: 'Ops Feed',
    description:
      'Inspect notification events, failed sends, and usage alerts so support actions stay inside the app instead of Supabase.',
    icon: FiBell,
    status: 'Foundation ready',
  },
];

const SAFE_START_STEPS = [
  'Run the new role migration in Supabase.',
  'Promote only your own profile row to role = admin first.',
  'Refresh your session, then use /admin or the new sidebar admin link.',
  'Keep destructive actions server-backed when we add them later.',
];

const AdminOverview = () => (
  <AdminLayout
    eyebrow="Internal Console"
    title="Admin foundation"
    description="This area is the control surface for internal operations. The goal is to keep risky actions isolated here instead of mixing them into the user dashboard."
  >
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[2rem] border border-black/5 bg-white/85 p-7 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.25)] md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
              What This Does
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#111111]">
              Separate admin controls without touching user settings flow
            </h2>
          </div>
          <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-[#111111] text-white md:flex">
            <FiShield size={24} />
          </div>
        </div>

        <p className="mt-5 max-w-3xl text-sm leading-8 text-zinc-700 md:text-[15px]">
          This is the first safe layer: role-based access, a guarded route, and a dedicated admin
          workspace. It gives you a stable place to add user management, campaigns, waitlist
          tools, and plan controls without leaking internal actions into the public dashboard.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {ADMIN_SURFACES.map((surface) => (
            <article
              key={surface.title}
              className="rounded-[1.5rem] border border-black/5 bg-[#f6f1ea] p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#111111] shadow-sm">
                  <surface.icon size={20} />
                </div>
                <span className="rounded-full bg-black px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                  {surface.status}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[#111111]">{surface.title}</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-700">{surface.description}</p>
            </article>
          ))}
        </div>
      </div>

      <aside className="space-y-6">
        <section className="rounded-[2rem] bg-[#111111] p-7 text-white shadow-[0_24px_80px_-50px_rgba(0,0,0,0.45)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
            Safe Start
          </p>
          <ol className="mt-5 space-y-4 text-sm leading-7 text-zinc-300">
            {SAFE_START_STEPS.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-[11px] font-bold text-white">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-[2rem] border border-black/5 bg-white/85 p-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
            Next Recommended Build
          </p>
          <div className="mt-5 space-y-5">
            <div>
              <h3 className="text-base font-semibold text-[#111111]">Users page</h3>
              <p className="mt-2 text-sm leading-7 text-zinc-700">
                Read-only list first. Search by email, role, plan, and waitlist status before we
                add destructive controls.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111111]">Campaign composer</h3>
              <p className="mt-2 text-sm leading-7 text-zinc-700">
                A simple form for product updates so you can write subject and message once, then
                send email plus in-app notifications without code changes.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111111]">Waitlist review</h3>
              <p className="mt-2 text-sm leading-7 text-zinc-700">
                Surface Pro waitlist signups in-app so you stop jumping between Supabase tables.
              </p>
            </div>
          </div>
        </section>
      </aside>
    </section>
  </AdminLayout>
);

export default AdminOverview;
