import type { ReactNode } from 'react';
import { FiArrowUpRight } from 'react-icons/fi';
import { Link, NavLink } from 'react-router-dom';
import Footer from '../landing/Footer';
import Seo from '../seo/Seo';
import { DOCS_NAV_ITEMS, type DocsSectionLink } from '../../data/docs';
import { buildSeoUrl } from '../../lib/seo';

interface DocsLayoutProps {
  title: string;
  description: string;
  path: string;
  eyebrow: string;
  intro: string;
  heroAside?: ReactNode;
  sectionLinks?: DocsSectionLink[];
  children: ReactNode;
}

const DocsLayout = ({
  title,
  description,
  path,
  eyebrow,
  intro,
  heroAside,
  sectionLinks,
  children,
}: DocsLayoutProps) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    url: buildSeoUrl(path),
    about: ['ResumeeNow docs', 'developer guide', 'API reference'],
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#14171C]">
      <Seo
        title={`${title} | ResumeeNow`}
        description={description}
        path={path}
        type="article"
        structuredData={structuredData}
      />

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#DDD5C7] blur-3xl opacity-70" />
          <div className="absolute right-0 top-36 h-80 w-80 rounded-full bg-[#DDE6F8] blur-3xl opacity-60" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white blur-3xl opacity-60" />
        </div>

        <header className="sticky top-0 z-30 border-b border-black/8 bg-white/78 backdrop-blur-md">
          <div className="max-w-360 mx-auto flex min-h-20 items-center justify-between gap-4 px-6">
            <Link to="/" className="inline-flex items-center gap-3 opacity-90 transition-opacity hover:opacity-100">
              <img
                src="/resumeenowlogo.png"
                alt="ResumeeNow logo"
                className="h-6 w-6 object-contain"
              />
              <span className="text-lg font-medium tracking-tight text-black/90">
                Resumee<span className="text-zinc-500">Now.</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-2 lg:flex">
              {DOCS_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    `rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-black/18 bg-[#14171C] text-white'
                        : 'border-black/10 bg-white/75 text-black/65 hover:border-black/20 hover:text-black'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <a
                href="/"
                className="inline-flex rounded-full bg-[#14171C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black"
              >
                Home
              </a>
            </div>
          </div>
        </header>

        <main className="relative">
          <section className="max-w-360 mx-auto px-6 pt-16 pb-10 md:pt-24 md:pb-14">
            <div className={`grid gap-10 ${heroAside ? 'lg:grid-cols-[minmax(0,1.08fr)_320px] lg:items-end' : ''}`}>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/45">
                  {eyebrow}
                </p>
                <h1 className="mt-4 max-w-4xl text-4xl tracking-[-0.04em] text-[#12151A] md:text-6xl md:leading-[0.95]">
                  {title}
                </h1>
                <p className="mt-5 max-w-3xl text-base font-light leading-relaxed text-black/68 md:text-lg">
                  {intro}
                </p>
              </div>
              {heroAside ? heroAside : null}
            </div>
          </section>

          <section className="max-w-360 mx-auto px-6 pb-20 md:pb-24">
            <div className={`grid gap-8 ${sectionLinks?.length ? 'lg:grid-cols-[260px_minmax(0,1fr)]' : ''}`}>
              {sectionLinks?.length ? (
                <aside className="lg:sticky lg:top-28 lg:self-start">
                  <div className="rounded-[28px] border border-black/10 bg-white/88 p-5 shadow-[0_18px_55px_rgba(18,21,26,0.08)] backdrop-blur-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
                      On this page
                    </p>
                    <div className="mt-4 space-y-2">
                      {sectionLinks.map((link) => (
                        <a
                          key={link.id}
                          href={`#${link.id}`}
                          className="flex items-center justify-between rounded-2xl border border-black/8 bg-[#F6F3ED] px-4 py-3 text-sm text-black/72 transition-colors hover:border-black/14 hover:text-black"
                        >
                          <span>{link.label}</span>
                          <FiArrowUpRight className="h-4 w-4 text-black/45" />
                        </a>
                      ))}
                    </div>

                  </div>
                </aside>
              ) : null}

              <div className="space-y-8">{children}</div>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default DocsLayout;
