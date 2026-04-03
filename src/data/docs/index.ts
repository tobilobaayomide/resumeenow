import type { IconType } from 'react-icons';
import {
  FiBookOpen,
  FiCode,
  FiCompass,
  FiCpu,
  FiDatabase,
  FiLayers,
  FiLock,
  FiServer,
  FiShield,
  FiZap,
} from 'react-icons/fi';

export type DocsNavItem = {
  label: string;
  href: string;
  description: string;
};

export type DocsSectionLink = {
  id: string;
  label: string;
};

export type DocsFeatureCard = {
  title: string;
  description: string;
  bullets: string[];
  icon: IconType;
};

export type ApiRouteCard = {
  method: 'GET' | 'POST';
  path: string;
  auth: string;
  purpose: string;
  consumedBy: string;
  request?: string[];
  rules?: string[];
};

export type ApiRouteGroup = {
  title: string;
  description: string;
  routes: ApiRouteCard[];
};

export type DocsTimelineItem = {
  title: string;
  body: string;
};

export const DOCS_NAV_ITEMS: DocsNavItem[] = [
  {
    label: 'Docs home',
    href: '/doc',
    description: 'Entry point for the full documentation set.',
  },
  {
    label: 'Developer guide',
    href: '/doc/developer-guide',
    description: 'Architecture, system map, backend boundaries, and migration notes.',
  },
  {
    label: 'API reference',
    href: '/doc/api-reference',
    description: 'Current internal Vercel routes and the Supabase AI function.',
  },
];

export const DOCS_HOME_CARDS = [
  {
    title: 'Developer guide',
    href: '/doc/developer-guide',
    description:
      'The architecture map for product surfaces, route boundaries, state owners, tables, roles, and deployment responsibilities.',
    eyebrow: 'System map',
  },
  {
    title: 'API reference',
    href: '/doc/api-reference',
    description:
      'The current request contracts for admin routes, notifications, parsing, export, and the Gemini AI edge entrypoint.',
    eyebrow: 'Contracts',
  },
  {
    title: 'Backend transition notes',
    href: '/doc/developer-guide#custom-backend',
    description:
      'The coupling points a future backend team must preserve if auth, data, notifications, or AI move off Supabase.',
    eyebrow: 'Migration path',
  },
];

export const DEVELOPER_GUIDE_SECTION_LINKS: DocsSectionLink[] = [
  { id: 'product-map', label: 'Product map' },
  { id: 'repo-structure', label: 'Repo structure' },
  { id: 'backend-owners', label: 'Backend owners' },
  { id: 'data-model', label: 'Data model' },
  { id: 'custom-backend', label: 'Custom backend path' },
  { id: 'deployments', label: 'Deployments' },
];

export const API_REFERENCE_SECTION_LINKS: DocsSectionLink[] = [
  { id: 'api-rules', label: 'Common rules' },
  { id: 'admin-routes', label: 'Admin routes' },
  { id: 'app-routes', label: 'App routes' },
  { id: 'ai-route', label: 'AI edge route' },
  { id: 'contract-notes', label: 'Contract notes' },
];

export const PRODUCT_SURFACE_CARDS: DocsFeatureCard[] = [
  {
    title: 'Public surface',
    description: 'Marketing, legal, onboarding entry, and the public docs route all live outside the authenticated app shell.',
    bullets: [
      'Landing page handles auth modal entry and template preselection',
      'Public docs live at /doc and are meant for external developer handoff',
      'Legal pages reuse the same public styling language and SEO layer',
    ],
    icon: FiCompass,
  },
  {
    title: 'Workspace surface',
    description: 'The dashboard is the signed-in control room for resumes, templates, settings, and plan state.',
    bullets: [
      'ProtectedAppLayout is the route boundary for signed-in access',
      'Dashboard, Templates, Pro, Profile, and Settings each live under /dashboard',
      'PlanContext and AuthContext are the key cross-route state owners',
    ],
    icon: FiLayers,
  },
  {
    title: 'Builder surface',
    description: 'The builder owns editing, autosave, preview, parsing, and export flows for resume records.',
    bullets: [
      'BuilderPage hydrates resume state from persisted data',
      'Preview, pagination, print, and template rendering are split into dedicated builder modules',
      'PDF export passes through a print route rather than exporting from the client directly',
    ],
    icon: FiCode,
  },
  {
    title: 'Admin surface',
    description: 'The admin console is internal, but it still runs inside the main app and shares the same deploy target.',
    bullets: [
      'AdminRouteLayout gates /admin paths',
      'super_admin owns the highest-risk actions',
      'Admin APIs are expected to go through the shared admin helper and audit logging',
    ],
    icon: FiShield,
  },
];

export const REPO_STRUCTURE_CARDS: DocsFeatureCard[] = [
  {
    title: 'Frontend routes and pages',
    description: 'Route entry files stay in src/pages while most surface implementation lives deeper in components.',
    bullets: [
      'src/App.tsx declares route boundaries and lazy-loaded entry points',
      'src/pages hosts landing, admin, legal, print, and docs entry files',
      'Route-level pages usually hand off to feature components quickly',
    ],
    icon: FiLayers,
  },
  {
    title: 'Feature components',
    description: 'Feature modules are split by surface so dashboard, admin, builder, landing, legal, and docs stay isolated.',
    bullets: [
      'src/components/dashboard for the user workspace',
      'src/components/admin for internal operations',
      'src/components/builder for editing, preview, print, and templates',
    ],
    icon: FiBookOpen,
  },
  {
    title: 'State and data access',
    description: 'Query helpers, client adapters, and app contexts live outside presentational components.',
    bullets: [
      'src/context hosts AuthContext and PlanContext',
      'src/lib/queries holds Supabase and API request helpers',
      'src/lib/notifications and src/lib/auth hold supporting client adapters',
    ],
    icon: FiDatabase,
  },
  {
    title: 'Server boundaries',
    description: 'There are two server runtimes: Vercel routes in api and one Supabase edge function for AI.',
    bullets: [
      'api/* handles admin actions, campaigns, notifications, export, and parsing',
      'supabase/functions/gemini-proxy is the AI gateway',
      'supabase/migrations is the source of schema and policy changes',
    ],
    icon: FiServer,
  },
];

export const BACKEND_OWNER_CARDS: DocsFeatureCard[] = [
  {
    title: 'Authentication',
    description: 'Supabase Auth is the current auth provider and bearer-token source for every protected server route.',
    bullets: [
      'AuthContext manages session boot, auth change subscriptions, and sign-out behavior',
      'src/lib/auth/accessToken.ts is the client-side token handoff used before calling protected routes',
      'Any backend replacement must still provide a client-readable access token path for these calls',
    ],
    icon: FiLock,
  },
  {
    title: 'Application data',
    description: 'Most user data is stored in Supabase Postgres and accessed directly from the app through query helpers.',
    bullets: [
      'Resumes, profiles, subscriptions, waitlist records, and notification rows all live in Postgres',
      'RLS is part of the enforcement story for suspension and normal user isolation',
      'If a custom backend replaces this, frontend query helpers should stay the contract layer instead of components talking directly to a new API',
    ],
    icon: FiDatabase,
  },
  {
    title: 'Privileged actions',
    description: 'Admin actions and some system-triggered behaviors already go through Vercel server routes with service-role access.',
    bullets: [
      'api/_lib/admin.ts centralizes admin bearer-token validation, role checks, and audit logging',
      'User deletion, role changes, Pro access, campaigns, and notification sends are already server-owned',
      'A custom backend can absorb these first with minimal impact if route contracts are preserved',
    ],
    icon: FiShield,
  },
  {
    title: 'AI gateway',
    description: 'AI is already isolated behind one server entrypoint instead of scattered client calls.',
    bullets: [
      'gemini-proxy validates JWTs and enforces usage policies',
      'PlanContext expects usage data back from this boundary',
      'Moving off Supabase here mainly means preserving the prompt, streaming, and usage response contract',
    ],
    icon: FiCpu,
  },
];

export const DATA_MODEL_CARDS: DocsFeatureCard[] = [
  {
    title: 'User identity and access',
    description: 'Identity and access state are split between auth.users and profiles.',
    bullets: [
      'profiles stores role and account_status',
      'role values: user, admin, super_admin',
      'account_status values: active, suspended',
    ],
    icon: FiLock,
  },
  {
    title: 'Resume and plan data',
    description: 'The workspace depends on a small set of tables that drive editing, billing state, and usage.',
    bullets: [
      'resumes stores persisted resume content',
      'user_subscriptions stores plan tier and entitlement state',
      'user_api_usage stores AI usage and reset windows',
    ],
    icon: FiDatabase,
  },
  {
    title: 'Notifications and campaigns',
    description: 'Email and in-app delivery share one event model.',
    bullets: [
      'notification_preferences stores per-user opt-ins',
      'notification_events stores actual deliveries and in-app bell items',
      'admin_action_logs stores audit records for privileged actions',
    ],
    icon: FiZap,
  },
  {
    title: 'Growth and admin data',
    description: 'Admin and growth surfaces are backed by the same primary database instead of a separate operations system.',
    bullets: [
      'Waitlist state is stored in product tables and surfaced in admin views',
      'Campaign history is grouped from notification events',
      'Admin pages are read-write operational surfaces, not just reporting dashboards',
    ],
    icon: FiBookOpen,
  },
];

export const CUSTOM_BACKEND_TIMELINE: DocsTimelineItem[] = [
  {
    title: '1. Preserve auth token flow first',
    body:
      'Before changing data storage, preserve the current ability for the client to fetch a bearer token and call protected routes. AuthContext, accessToken helpers, and server route guards already assume that shape.',
  },
  {
    title: '2. Move privileged routes before direct table reads',
    body:
      'Admin actions, campaigns, notifications, export, and parsing are already server-owned. They are the safest first candidates to move into a dedicated backend because React components already treat them as HTTP boundaries.',
  },
  {
    title: '3. Replace query helpers, not feature components',
    body:
      'When moving resume, profile, or settings data off Supabase, keep the change behind src/lib/queries and related schemas. Components should keep consuming typed helpers rather than learning a new backend shape directly.',
  },
  {
    title: '4. Recreate policy behavior, not just CRUD',
    body:
      'Current behavior depends on more than table access. Role checks, suspension blocking, audit logs, notification opt-outs, and AI usage limits must move with the data layer or behavior will silently regress.',
  },
  {
    title: '5. Keep AI and export contracts stable',
    body:
      'Builder and dashboard features expect current export and AI response shapes. If these services move, preserve request and response contracts first, then improve internals later.',
  },
];

export const DEPLOYMENT_NOTES: DocsTimelineItem[] = [
  {
    title: 'Frontend and Vercel route changes',
    body: 'Push code and redeploy Vercel. This covers React pages and api/* serverless routes.',
  },
  {
    title: 'Database schema or policy changes',
    body: 'Run the relevant Supabase migration before relying on new columns, tables, roles, or RLS changes.',
  },
  {
    title: 'AI enforcement changes',
    body: 'If gemini-proxy changes, also deploy the Supabase edge function or the app and backend limits will drift.',
  },
];

export const API_ROUTE_GROUPS: ApiRouteGroup[] = [
  {
    title: 'Admin routes',
    description: 'Internal operations routes used by the admin console.',
    routes: [
      {
        method: 'GET',
        path: '/api/admin-users',
        auth: 'admin or super_admin bearer token',
        purpose: 'Returns the admin-facing user list with role, plan, waitlist, status, and AI usage fields.',
        consumedBy: 'Admin users view and overview summary cards.',
        rules: [
          'Suspended admin accounts are rejected',
          'Use this list for surfaces; deeper activity comes from the detail route',
        ],
      },
      {
        method: 'GET',
        path: '/api/admin-user-detail?userId=<uuid>',
        auth: 'admin or super_admin bearer token',
        purpose: 'Returns detail for one selected account, including recent resumes and recent notification activity.',
        consumedBy: 'Selected-user inspector in the admin users view.',
        request: ['Query param: userId'],
      },
      {
        method: 'POST',
        path: '/api/admin-user-actions',
        auth: 'admin or super_admin bearer token',
        purpose: 'Runs privileged user actions from the admin console.',
        consumedBy: 'User support actions in the admin users and waitlist views.',
        request: [
          'Body: { userId, action }',
          'Actions: promote_admin, demote_admin, grant_pro, revoke_pro, suspend_user, unsuspend_user, delete_user, reset_ai_usage, resend_welcome_email',
        ],
        rules: [
          'Only super_admin can change admin roles',
          'Only super_admin can delete users',
          'Actions are audit-logged',
        ],
      },
      {
        method: 'POST',
        path: '/api/admin-campaigns',
        auth: 'admin or super_admin bearer token',
        purpose: 'Sends admin campaigns by email, in-app, or both and writes campaign events.',
        consumedBy: 'Admin campaigns composer.',
        request: [
          'Body: { subject, title, body, audience, sendEmail, sendInApp, ctaLabel?, ctaHref? }',
          'Audiences: product_updates, waitlist, all_users',
        ],
        rules: [
          'Only super_admin can send email campaigns',
          'Only super_admin can target all_users',
          'Email respects product_updates opt-outs and excludes suspended accounts',
        ],
      },
      {
        method: 'GET',
        path: '/api/admin-campaign-history',
        auth: 'admin or super_admin bearer token',
        purpose: 'Returns grouped campaign history for the admin console with sent, skipped, and failed delivery counts.',
        consumedBy: 'Campaign history list and overview summaries.',
      },
    ],
  },
  {
    title: 'Application routes',
    description: 'Routes used by the signed-in product itself for notifications, parsing, and export.',
    routes: [
      {
        method: 'POST',
        path: '/api/notification-events',
        auth: 'signed-in user bearer token',
        purpose: 'Creates or sends app-triggered notifications such as welcome, waitlist, and AI usage alerts.',
        consumedBy: 'Auth, plan, and notification client helpers.',
        request: [
          'Body: { type, payload }',
          'Types: welcome_email, weekly_digest, ai_usage_alert, pro_waitlist_joined',
        ],
        rules: [
          'Suspended users are blocked',
          'One-time events and threshold alerts are deduped server-side',
        ],
      },
      {
        method: 'POST',
        path: '/api/parse-resume',
        auth: 'signed-in user bearer token',
        purpose: 'Parses an uploaded PDF resume into the app’s internal resume shape.',
        consumedBy: 'Resume import and parser helpers.',
        request: [
          'Raw PDF body',
          'Headers: Authorization and x-resume-file-name',
        ],
        rules: [
          'PDF only',
          'Maximum file size: 8 MB',
        ],
      },
      {
        method: 'POST',
        path: '/api/export-pdf',
        auth: 'signed-in user bearer token',
        purpose: 'Renders the print page and returns a generated PDF export.',
        consumedBy: 'Builder export flow and dashboard export helpers.',
        request: [
          'Body: { data, templateId, fileName }',
          'data must match the internal ResumeData export payload schema',
        ],
        rules: [
          'Renders through /print/resume',
          'Origin is derived from request host or configured env',
        ],
      },
    ],
  },
  {
    title: 'AI route',
    description: 'The one server boundary for AI generation and usage enforcement.',
    routes: [
      {
        method: 'POST',
        path: 'supabase/functions/v1/gemini-proxy',
        auth: 'signed-in user bearer token',
        purpose: 'Gated AI entrypoint for builder and dashboard features.',
        consumedBy: 'Builder AI actions and dashboard AI helpers.',
        request: [
          'Body: { prompt, expectJson?, stream? }',
          'Returns JSON or SSE depending on stream mode',
        ],
        rules: [
          'Blocks suspended users',
          'Admin and super_admin bypass normal usage caps',
          'Non-admin users are limited by daily credits, concurrency, and request windows',
        ],
      },
    ],
  },
];

export const API_CONTRACT_NOTES: DocsTimelineItem[] = [
  {
    title: 'Keep response shapes stable at the helper boundary',
    body:
      'If a new backend is introduced, the frontend should mostly keep consuming the same query helpers and schemas. Replace internals in src/lib/queries and route handlers before changing UI contracts.',
  },
  {
    title: 'Preserve admin helper semantics',
    body:
      'New privileged routes should keep central role validation, suspended-account rejection, and audit logging in one shared helper instead of duplicating logic per route.',
  },
  {
    title: 'Treat gemini-proxy as a product contract',
    body:
      'The AI route is more than a generation wrapper. It owns usage accounting and policy enforcement, so a future backend must preserve both the response contract and the guardrails.',
  },
];
