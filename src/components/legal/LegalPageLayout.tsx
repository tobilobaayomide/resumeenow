import type { ReactNode } from 'react';
import Footer from '../landing/Footer';
import { LEGAL_COMPANY_NAME } from '../../data/legal';
import Seo from '../seo/Seo';
import { buildSeoUrl } from '../../lib/seo';

interface LegalPageLayoutProps {
  title: string;
  summary: string;
  path: string;
  children: ReactNode;
}

const LegalPageLayout = ({ title, summary, path, children }: LegalPageLayoutProps) => {
  const pageTitle = `${title} | ${LEGAL_COMPANY_NAME}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitle,
    description: summary,
    url: buildSeoUrl(path),
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#14171C]">
      <Seo
        title={pageTitle}
        description={summary}
        path={path}
        type="article"
        structuredData={structuredData}
      />
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-88 w-88 -translate-x-1/2 rounded-full bg-[#DDD5C7] blur-3xl opacity-70" />
          <div className="absolute -right-24 top-40 h-72 w-72 rounded-full bg-[#DDE6F8] blur-3xl opacity-65" />
          <div className="absolute bottom-8 -left-16 h-64 w-64 rounded-full bg-white blur-3xl opacity-70" />
        </div>

        <header className="relative border-b border-black/8 bg-white/75 backdrop-blur-md">
          <div className="max-w-360 mx-auto flex h-20 items-center justify-between px-6">
            <a
              href="/"
              className="inline-flex items-center gap-3 opacity-90 transition-opacity hover:opacity-100"
            >
              <img
                src="/resumeenowlogo.png"
                alt={`${LEGAL_COMPANY_NAME} logo`}
                className="h-6 w-6 object-contain"
              />
              <span className="text-lg font-medium tracking-tight text-black/90">
                Resumee<span className="text-zinc-500">Now.</span>
              </span>
            </a>

            <a
              href="/"
              className="inline-flex h-11 items-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black/75 transition-colors hover:border-black/20 hover:text-black"
            >
              Back to home
            </a>
          </div>
        </header>

        <main className="relative">
          <section className="max-w-360 mx-auto px-6 pt-18 pb-10 md:pt-24 md:pb-14">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/45">
                Public Legal Page
              </p>
              <h1 className="mt-4 text-4xl tracking-[-0.03em] text-[#12151A] md:text-6xl md:leading-[0.95]">
                {title}
              </h1>
              <p className="mt-5 max-w-2xl text-base font-light leading-relaxed text-black/68 md:text-lg">
                {summary}
              </p>
            </div>
          </section>

          <section className="max-w-360 mx-auto px-6 pb-18 md:pb-24">
            <article className="rounded-4xl border border-black/10 bg-white/92 px-6 py-8 shadow-[0_24px_70px_rgba(18,21,26,0.10)] backdrop-blur-sm md:px-10 md:py-12">
              <div className="space-y-10 text-sm leading-7 text-black/75 md:text-[15px]">
                {children}
              </div>
            </article>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default LegalPageLayout;
