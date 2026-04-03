import { FiArrowRight, FiBookOpen, FiCode, FiLayers } from 'react-icons/fi';
import DocsLayout from '../components/docs/DocsLayout';
import { DOCS_HOME_CARDS, DOCS_NAV_ITEMS } from '../data/docs';

const DocsPage = () => {
  return (
    <DocsLayout
      title="ResumeeNow docs"
      description="Public developer documentation for the ResumeeNow app, including architecture guidance and internal API contracts."
      path="/doc"
      eyebrow="Public Docs"
      intro="Use this section as the real website handoff for future engineers. It maps the product, shows where backend responsibilities live today, and documents the current internal API contracts."
      heroAside={(
        <div className="rounded-4xl border border-black/10 bg-[#14171C] p-6 text-white shadow-[0_26px_80px_rgba(18,21,26,0.18)]">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">
            Docs Snapshot
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl tracking-tight">3</p>
              <p className="mt-1 text-xs text-white/58">Public docs pages</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl tracking-tight">9</p>
              <p className="mt-1 text-xs text-white/58">Internal route contracts</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl tracking-tight">1</p>
              <p className="mt-1 text-xs text-white/58">AI gateway boundary</p>
            </div>
          </div>
        </div>
      )}
    >
      <section className="rounded-4xl border border-black/10 bg-white/92 p-6 shadow-[0_22px_70px_rgba(18,21,26,0.09)] backdrop-blur-sm md:p-8">
        <div className="border-b border-black/8 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
            Start here
          </p>
          <h2 className="mt-3 text-3xl tracking-[-0.03em] text-[#12151A] md:text-4xl">
            Pick the right entry point.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-black/66 md:text-[15px]">
            The docs index stays short on purpose. The deeper pages carry the real detail so a future developer can
            jump straight to architecture or contracts without scrolling through one long mixed document.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {DOCS_HOME_CARDS.map((card, index) => {
            const iconMap = [FiLayers, FiCode, FiBookOpen];
            const Icon = iconMap[index];

            return (
              <a
                key={card.href}
                href={card.href}
                className="group rounded-[28px] border border-black/8 bg-[#FBF9F4] p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/42">
                      {card.eyebrow}
                    </p>
                    <h3 className="mt-3 text-xl tracking-tight text-[#12151A]">{card.title}</h3>
                  </div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/8 bg-white text-[#12151A]">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-black/68">{card.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#12151A]">
                  Open page
                  <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </a>
            );
          })}
        </div>
      </section>

      <section className="rounded-4xl border border-black/10 bg-[#14171C] p-6 text-white shadow-[0_22px_70px_rgba(18,21,26,0.16)] md:p-8">
        <div className="grid gap-5 md:grid-cols-3">
          {DOCS_NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-[28px] border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/8"
            >
              <p className="text-lg tracking-tight text-white">{item.label}</p>
              <p className="mt-2 text-sm leading-6 text-white/68">{item.description}</p>
            </a>
          ))}
        </div>
      </section>
    </DocsLayout>
  );
};

export default DocsPage;
