import { FiArrowUpRight, FiBookOpen, FiShield, FiZap } from 'react-icons/fi';
import DocsLayout from '../components/docs/DocsLayout';
import {
  API_CONTRACT_NOTES,
  API_REFERENCE_SECTION_LINKS,
  API_ROUTE_GROUPS,
} from '../data/docs';

const DocsApiReferencePage = () => {
  return (
    <DocsLayout
      title="API reference"
      description="Internal API reference for ResumeeNow, covering admin routes, user-triggered routes, export, parsing, and the AI edge function."
      path="/doc/api-reference"
      eyebrow="API Reference"
      intro="These are internal application contracts, not a public third-party API. They matter because the frontend, admin tools, and AI flows already depend on them as stable boundaries."
      sectionLinks={API_REFERENCE_SECTION_LINKS}
      heroAside={(
        <div className="rounded-4xl border border-black/10 bg-[#14171C] p-6 text-white shadow-[0_26px_80px_rgba(18,21,26,0.18)]">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">
            Contract posture
          </p>
          <div className="mt-5 space-y-3 text-sm leading-6 text-white/72">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Most routes expect <span className="font-mono text-[13px] text-white">Authorization: Bearer &lt;token&gt;</span>.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Admin routes already centralize role checks and audit logging.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              The AI route is the strictest runtime boundary because it also owns usage enforcement.
            </div>
          </div>
        </div>
      )}
    >
      <section
        id="api-rules"
        className="scroll-mt-28 rounded-4xl border border-black/10 bg-white/92 p-6 shadow-[0_22px_70px_rgba(18,21,26,0.09)] backdrop-blur-sm md:p-8"
      >
        <div className="border-b border-black/8 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
            Common rules
          </p>
          <h2 className="mt-3 text-3xl tracking-[-0.03em] text-[#12151A] md:text-4xl">
            The defaults future backend work should preserve.
          </h2>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-[28px] border border-black/8 bg-[#FBF9F4] p-5">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/8 bg-white text-[#12151A]">
              <FiShield className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-xl tracking-tight text-[#12151A]">Auth</h3>
            <p className="mt-2 text-sm leading-6 text-black/68">
              Most protected routes require a Supabase access token from the signed-in client session.
            </p>
          </article>
          <article className="rounded-[28px] border border-black/8 bg-[#FBF9F4] p-5">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/8 bg-white text-[#12151A]">
              <FiBookOpen className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-xl tracking-tight text-[#12151A]">Shape</h3>
            <p className="mt-2 text-sm leading-6 text-black/68">
              Admin routes mostly return JSON. Some older app routes still return plain-text success or error strings.
            </p>
          </article>
          <article className="rounded-[28px] border border-black/8 bg-[#FBF9F4] p-5">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/8 bg-white text-[#12151A]">
              <FiZap className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-xl tracking-tight text-[#12151A]">Guardrails</h3>
            <p className="mt-2 text-sm leading-6 text-black/68">
              Suspension, role checks, opt-outs, and AI usage enforcement are part of the contract, not optional extras.
            </p>
          </article>
        </div>
      </section>

      {API_ROUTE_GROUPS.map((group, index) => (
        <section
          key={group.title}
          id={index === 0 ? 'admin-routes' : index === 1 ? 'app-routes' : 'ai-route'}
          className="scroll-mt-28 rounded-4xlrder border-black/10 bg-white/92 p-6 shadow-[0_22px_70px_rgba(18,21,26,0.09)] backdrop-blur-sm md:p-8"
        >
          <div className="border-b border-black/8 pb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
              {group.title}
            </p>
            <h2 className="mt-3 text-3xl tracking-[-0.03em] text-[#12151A] md:text-4xl">
              {group.title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-black/66 md:text-[15px]">
              {group.description}
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            {group.routes.map((route) => (
              <article key={`${route.method}-${route.path}`} className="rounded-[28px] border border-black/8 bg-[#FBF9F4] p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-[#14171C] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                        {route.method}
                      </span>
                      <code className="rounded-full border border-black/8 bg-white px-3 py-1 text-[13px] text-[#12151A]">
                        {route.path}
                      </code>
                    </div>
                    <p className="mt-4 text-base leading-7 text-[#12151A]">{route.purpose}</p>
                  </div>

                  <div className="rounded-3xl border border-black/8 bg-white px-4 py-3 text-sm text-black/68 md:min-w-74">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-black/42">Auth</p>
                    <p className="mt-2 leading-6 text-[#12151A]">{route.auth}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.82fr)]">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/42">
                      Request shape
                    </p>
                    <ul className="mt-3 space-y-2.5 text-sm leading-6 text-black/72">
                      {(route.request ?? ['No extra request notes beyond method, path, and auth.']).map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#12151A]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/42">
                      Guardrails
                    </p>
                    <ul className="mt-3 space-y-2.5 text-sm leading-6 text-black/72">
                      {(route.rules ?? ['No extra route-specific rules are documented beyond its auth requirements.']).map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#12151A]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-3xl border border-black/8 bg-white p-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-black/42">Consumed by</p>
                    <p className="mt-3 text-sm leading-6 text-black/72">{route.consumedBy}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section
        id="contract-notes"
        className="scroll-mt-28 rounded-4xl border border-black/10 bg-[#14171C] p-6 text-white shadow-[0_22px_70px_rgba(18,21,26,0.16)] md:p-8"
      >
        <div className="border-b border-white/10 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
            Contract notes
          </p>
          <h2 className="mt-3 text-3xl tracking-[-0.03em] text-white md:text-4xl">
            Notes for future backend work.
          </h2>
        </div>
        <div className="mt-6 space-y-4">
          {API_CONTRACT_NOTES.map((item) => (
            <article key={item.title} className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <h3 className="text-xl tracking-tight text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">{item.body}</p>
            </article>
          ))}
        </div>
        <a
          href="/doc/developer-guide#custom-backend"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white"
        >
          Read the custom backend migration section
          <FiArrowUpRight className="h-4 w-4" />
        </a>
      </section>
    </DocsLayout>
  );
};

export default DocsApiReferencePage;
