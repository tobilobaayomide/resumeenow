import { FiArrowUpRight, FiCode, FiDatabase, FiServer } from 'react-icons/fi';
import DocsLayout from '../components/docs/DocsLayout';
import {
  BACKEND_OWNER_CARDS,
  CUSTOM_BACKEND_TIMELINE,
  DATA_MODEL_CARDS,
  DEPLOYMENT_NOTES,
  DEVELOPER_GUIDE_SECTION_LINKS,
  PRODUCT_SURFACE_CARDS,
  REPO_STRUCTURE_CARDS,
} from '../data/docs';

const cardGridClass = 'mt-6 grid gap-4 md:grid-cols-2';

const DocsDeveloperGuidePage = () => {
  return (
    <DocsLayout
      title="Developer guide"
      description="Architecture guide for ResumeeNow, covering product surfaces, repo layout, backend boundaries, data ownership, and migration notes for a future custom backend."
      path="/doc/developer-guide"
      eyebrow="Developer Guide"
      intro="This is the system map. It explains how the public site, workspace, builder, admin console, server routes, and Supabase pieces fit together today, and where a future backend team would need to preserve behavior instead of only moving data."
      sectionLinks={DEVELOPER_GUIDE_SECTION_LINKS}
      heroAside={(
        <div className="rounded-4xl border-black/10 bg-[#14171C] p-6 text-white shadow-[0_26px_80px_rgba(18,21,26,0.18)]">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">
            Read path
          </p>
          <div className="mt-5 space-y-3 text-sm leading-6 text-white/72">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Start with the product map and repo structure.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Then read backend owners before touching auth, plans, AI, or admin behavior.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Use the custom backend section before moving anything off Supabase.
            </div>
          </div>
        </div>
      )}
    >
      <section
        id="product-map"
        className="scroll-mt-28 rounded-4xl border border-black/10 bg-white/92 p-6 shadow-[0_22px_70px_rgba(18,21,26,0.09)] backdrop-blur-sm md:p-8"
      >
        <div className="border-b border-black/8 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
            Product map
          </p>
          <h2 className="mt-3 text-3xl tracking-[-0.03em] text-[#12151A] md:text-4xl">
            Four surfaces, one product.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-black/66 md:text-[15px]">
            ResumeeNow is not one uniform app shell. Public, workspace, builder, and admin surfaces each have
            their own responsibilities, route boundaries, and risk levels.
          </p>
        </div>
        <div className={cardGridClass}>
          {PRODUCT_SURFACE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="rounded-[28px] border border-black/8 bg-[#FBF9F4] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl tracking-tight text-[#12151A]">{card.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-black/66">{card.description}</p>
                  </div>
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/8 bg-white text-[#12151A]">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <ul className="mt-4 space-y-2.5 text-sm leading-6 text-black/72">
                  {card.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#12151A]" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="repo-structure"
        className="scroll-mt-28 rounded-4xlrder border-black/10 bg-white/92 p-6 shadow-[0_22px_70px_rgba(18,21,26,0.09)] backdrop-blur-sm md:p-8"
      >
        <div className="border-b border-black/8 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
            Repo structure
          </p>
          <h2 className="mt-3 text-3xl tracking-[-0.03em] text-[#12151A] md:text-4xl">
            Where code is expected to live.
          </h2>
        </div>
        <div className={cardGridClass}>
          {REPO_STRUCTURE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="rounded-[28px] border border-black/8 bg-[#FBF9F4] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl tracking-tight text-[#12151A]">{card.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-black/66">{card.description}</p>
                  </div>
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/8 bg-white text-[#12151A]">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <ul className="mt-4 space-y-2.5 text-sm leading-6 text-black/72">
                  {card.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#12151A]" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="backend-owners"
        className="scroll-mt-28 rounded-4xl border border-black/10 bg-white/92 p-6 shadow-[0_22px_70px_rgba(18,21,26,0.09)] backdrop-blur-sm md:p-8"
      >
        <div className="border-b border-black/8 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
            Backend owners
          </p>
          <h2 className="mt-3 text-3xl tracking-[-0.03em] text-[#12151A] md:text-4xl">
            Who owns what today.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-black/66 md:text-[15px]">
            A future backend migration only works if the team understands which current responsibilities belong to
            Supabase Auth, Postgres, Vercel routes, and the AI edge function.
          </p>
        </div>
        <div className={cardGridClass}>
          {BACKEND_OWNER_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="rounded-[28px] border border-black/8 bg-[#FBF9F4] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl tracking-tight text-[#12151A]">{card.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-black/66">{card.description}</p>
                  </div>
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/8 bg-white text-[#12151A]">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <ul className="mt-4 space-y-2.5 text-sm leading-6 text-black/72">
                  {card.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#12151A]" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="data-model"
        className="scroll-mt-28 rounded-4xl border border-black/10 bg-white/92 p-6 shadow-[0_22px_70px_rgba(18,21,26,0.09)] backdrop-blur-sm md:p-8"
      >
        <div className="border-b border-black/8 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
            Data model
          </p>
          <h2 className="mt-3 text-3xl tracking-[-0.03em] text-[#12151A] md:text-4xl">
            The tables and system records that matter most.
          </h2>
        </div>
        <div className={cardGridClass}>
          {DATA_MODEL_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="rounded-[28px] border border-black/8 bg-[#FBF9F4] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl tracking-tight text-[#12151A]">{card.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-black/66">{card.description}</p>
                  </div>
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/8 bg-white text-[#12151A]">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <ul className="mt-4 space-y-2.5 text-sm leading-6 text-black/72">
                  {card.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#12151A]" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="custom-backend"
        className="scroll-mt-28 rounded-4xl border border-black/10 bg-[#14171C] p-6 text-white shadow-[0_22px_70px_rgba(18,21,26,0.16)] md:p-8"
      >
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
              Custom backend path
            </p>
            <h2 className="mt-3 text-3xl tracking-[-0.03em] text-white md:text-4xl">
              If the backend changes later, preserve behavior before internals.
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/70 md:text-[15px]">
              This is the section a future backend team should read before moving auth, data, notifications, or AI
              out of Supabase. Most risk comes from hidden behavior, not from table names.
            </p>
          </div>
          <div className="rounded-3xlrder border-white/10 bg-white/5 px-5 py-4 text-sm leading-6 text-white/72">
            Preserve these boundaries first:
            <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-white/48">
              <span>Auth token flow</span>
              <span>Admin helper</span>
              <span>AI contract</span>
              <span>Notification events</span>
            </div>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {CUSTOM_BACKEND_TIMELINE.map((item, index) => (
            <article key={item.title} className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="flex gap-4">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-xl tracking-tight text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">{item.body}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        id="deployments"
        className="scroll-mt-28 rounded-4xl border border-black/10 bg-white/92 p-6 shadow-[0_22px_70px_rgba(18,21,26,0.09)] backdrop-blur-sm md:p-8"
      >
        <div className="border-b border-black/8 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
            Deployments
          </p>
          <h2 className="mt-3 text-3xl tracking-[-0.03em] text-[#12151A] md:text-4xl">
            Know which runtime you are changing.
          </h2>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
          <div className="space-y-4">
            {DEPLOYMENT_NOTES.map((item) => (
              <article key={item.title} className="rounded-[28px] border border-black/8 bg-[#FBF9F4] p-5">
                <h3 className="text-xl tracking-tight text-[#12151A]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-black/68">{item.body}</p>
              </article>
            ))}
          </div>
          <div className="rounded-[30px] border border-black/8 bg-[#F6F3ED] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/42">
              Practical reminder
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex gap-3 rounded-2xl border border-black/8 bg-white p-4">
                <FiCode className="mt-1 h-4 w-4 shrink-0 text-black/55" />
                <p className="text-sm leading-6 text-black/68">React pages and api routes deploy through Vercel.</p>
              </div>
              <div className="flex gap-3 rounded-2xl border border-black/8 bg-white p-4">
                <FiDatabase className="mt-1 h-4 w-4 shrink-0 text-black/55" />
                <p className="text-sm leading-6 text-black/68">Schema and security changes depend on Supabase migrations.</p>
              </div>
              <div className="flex gap-3 rounded-2xl border border-black/8 bg-white p-4">
                <FiServer className="mt-1 h-4 w-4 shrink-0 text-black/55" />
                <p className="text-sm leading-6 text-black/68">AI behavior changes require the gemini-proxy edge function deploy too.</p>
              </div>
            </div>
            <a
              href="/doc/api-reference"
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#12151A]"
            >
              Continue to API reference
              <FiArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </DocsLayout>
  );
};

export default DocsDeveloperGuidePage;
