import LegalPageLayout from '../components/legal/LegalPageLayout';
import { LEGAL_COMPANY_NAME, LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from '../data/legal';

const TermsOfServicePage = () => {
  return (
    <LegalPageLayout
      title="Terms of Service"
      summary="These terms govern access to ResumeeNow and explain the rules for using the website, account system, resume workspace, exports, and AI-assisted tools."
    >
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
          Last updated {LEGAL_LAST_UPDATED}
        </p>
        <p>
          By accessing or using {LEGAL_COMPANY_NAME}, you agree to these Terms of Service. If you do not
          agree to these terms, do not use the service.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#12151A]">Use of the Service</h2>
        <p>
          You may use the service only in compliance with applicable law and these terms. You are
          responsible for the activity that occurs under your account and for keeping your login credentials
          secure.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#12151A]">Accounts and Eligibility</h2>
        <p>
          You must provide accurate information when creating an account and must be legally able to enter
          into a binding agreement to use the service. We may suspend or terminate accounts that violate
          these terms or create risk for the platform or other users.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#12151A]">Your Content</h2>
        <p>
          You retain ownership of the resume information, documents, and other content you upload or create
          in the service. You grant us a limited license to host, store, process, reproduce, and display
          that content only as needed to operate, maintain, and improve the service for you.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#12151A]">AI-Assisted Features</h2>
        <p>
          The service may provide AI-generated suggestions, edits, or outputs. Those outputs may be
          incomplete, inaccurate, or unsuitable for your situation. You are responsible for reviewing all
          generated content before relying on it, sharing it, or submitting it in an application.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#12151A]">Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Use the service for unlawful, fraudulent, abusive, or misleading purposes.</li>
          <li>Upload content you do not have the right to use.</li>
          <li>Attempt to interfere with the integrity, performance, or security of the platform.</li>
          <li>Reverse engineer, scrape, or automate access to the service beyond normal permitted use.</li>
          <li>Use the service to distribute malware, spam, or harmful code.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#12151A]">Availability and Changes</h2>
        <p>
          We may modify, suspend, or discontinue any part of the service at any time. We may also update
          these terms from time to time by posting the revised version on this page with a new effective
          date.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#12151A]">Termination</h2>
        <p>
          You may stop using the service at any time. We may suspend or terminate access if we reasonably
          believe you have violated these terms, created risk for other users, or exposed the service to
          liability.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#12151A]">Disclaimers</h2>
        <p>
          The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis to the fullest extent permitted by
          law. We do not guarantee that the service will be uninterrupted, error-free, or suitable for every
          job-search, legal, or career situation.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#12151A]">Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, {LEGAL_COMPANY_NAME} will not be liable for any indirect,
          incidental, special, consequential, exemplary, or punitive damages, or for any loss of data,
          revenue, profits, goodwill, or business opportunities arising from or related to your use of the
          service.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#12151A]">Contact</h2>
        <p>
          Questions about these Terms of Service can be sent to{' '}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="font-medium text-[#12151A] underline decoration-black/20 underline-offset-4"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </LegalPageLayout>
  );
};

export default TermsOfServicePage;
