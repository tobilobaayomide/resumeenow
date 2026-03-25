import LegalPageLayout from '../components/legal/LegalPageLayout';
import { LEGAL_COMPANY_NAME, LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from '../data/legal';

const PrivacyPolicyPage = () => {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      summary="This page explains what information ResumeeNow collects, how it is used, and the choices available to people who create accounts, import resumes, and sign in with providers like Google."
    >
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
          Last updated {LEGAL_LAST_UPDATED}
        </p>
        <p>
          This Privacy Policy describes how {LEGAL_COMPANY_NAME} collects, uses, stores, and shares
          information when you access our website, create an account, upload resume materials, or use
          our resume-building tools and related services.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#12151A]">Information We Collect</h2>
        <p>
          We collect information you provide directly, such as your name, email address, sign-in method,
          resume content, career history, uploaded documents, generated resume drafts, and any details you
          add while using the workspace.
        </p>
        <p>
          We may also collect limited technical information needed to operate and secure the service, such
          as IP address, browser type, device details, log data, and error reports.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#12151A]">How We Use Information</h2>
        <p>We use the information we collect to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Create and manage accounts.</li>
          <li>Authenticate users, including sign-in with Google or other supported providers.</li>
          <li>Store, edit, parse, export, and present resume content inside the app.</li>
          <li>Provide AI-assisted resume features when you choose to use them.</li>
          <li>Maintain security, prevent abuse, troubleshoot issues, and improve the service.</li>
          <li>Send essential service messages such as sign-in, account, or password-reset emails.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#12151A]">Google Sign-In and Third Parties</h2>
        <p>
          If you sign in with Google, we receive the profile information Google makes available to us for
          authentication, such as your name, email address, and account identifier. We use that information
          only to authenticate you, create your account, and support access to the service.
        </p>
        <p>
          We rely on third-party service providers to operate the platform, including authentication,
          database, hosting, file processing, and AI-generation providers. Those providers may process
          information on our behalf under their own contractual and legal obligations.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#12151A]">How We Share Information</h2>
        <p>We do not sell your personal information. We may share information only in these situations:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>With service providers that help us operate the app.</li>
          <li>When you direct us to process content through a feature you choose to use.</li>
          <li>To comply with legal obligations, enforce our terms, or protect users and the service.</li>
          <li>As part of a merger, acquisition, financing, or business transfer involving the service.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#12151A]">Data Retention</h2>
        <p>
          We keep account and workspace information for as long as your account remains active or as needed
          to provide the service, comply with legal obligations, resolve disputes, and enforce agreements.
          Backup copies and security logs may remain for a limited period after deletion.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#12151A]">Your Choices</h2>
        <p>
          You can update certain account information from within the service, choose whether to use Google
          sign-in, and request deletion of your account or associated data by contacting us.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#12151A]">Children&apos;s Privacy</h2>
        <p>
          The service is not directed to children under 13, and we do not knowingly collect personal
          information from children under 13.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#12151A]">Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. If we make material changes, we will update
          the date at the top of this page and may provide additional notice when appropriate.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#12151A]">Contact</h2>
        <p>
          For questions about this Privacy Policy or requests related to your personal data, contact us at{' '}
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

export default PrivacyPolicyPage;
