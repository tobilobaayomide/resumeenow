# ResumeeNow

ResumeeNow is a React and Vite application for building, parsing, editing, and exporting resumes. It combines a public marketing site, an authenticated dashboard, a resume builder with live preview, AI-assisted workflows, PDF parsing, and PDF export.

The codebase is organized around a few clear concerns:

- public landing and SEO
- authenticated dashboard and workspace state
- resume builder UI and template previewing
- schema-driven parsing and runtime validation
- serverless endpoints for PDF parsing and PDF export
- Supabase-backed auth, data access, AI credits, and edge functions

## Product Overview

Core capabilities:

- create resumes from templates
- upload and parse PDF resumes into editable data
- edit resume sections with live preview
- run AI workflows such as tailoring, ATS audit, and cover-letter generation
- save and manage resumes from a dashboard
- export resumes to PDF
- manage access tiers and AI usage limits

Public routes:

- `/` landing page
- `/privacy`
- `/terms`
- `/reset-password`

Protected routes:

- `/dashboard`
- `/dashboard/myresumes`
- `/dashboard/templates`
- `/dashboard/pro`
- `/dashboard/profile`
- `/dashboard/settings`
- `/builder/:id`

## Stack

- React 19
- TypeScript 5
- Vite 7
- Tailwind CSS 4
- React Router 7
- TanStack Query 5
- Zustand 5
- Zod 4
- Supabase auth, database, and edge functions
- Vercel serverless functions
- `unpdf` and `pdfjs-dist` for parsing
- `mammoth` for DOCX-related parsing utilities
- Playwright plus `@sparticuz/chromium` for server-side PDF export

## Architecture

### 1. App Shell

The client entrypoint is [src/main.tsx](./src/main.tsx). It mounts the app inside `AuthProvider`, which resolves the current Supabase user session without blocking public routes.

[src/App.tsx](./src/App.tsx) defines the route tree:

- public pages render directly
- authenticated routes are wrapped in `ProtectedAppLayout`
- dashboard and builder bundles are lazy-loaded

[src/components/app/ProtectedAppLayout.tsx](./src/components/app/ProtectedAppLayout.tsx) provides:

- auth gate enforcement
- `QueryClientProvider`
- `PlanProvider`
- `noindex,nofollow` metadata for private pages

### 2. Public Site

The landing page lives in [src/pages/LandingPage.tsx](./src/pages/LandingPage.tsx) and is built from components under [src/components/landing](./src/components/landing).

Key public concerns:

- marketing layout and section composition
- template selection before signup
- SEO metadata via [src/components/seo/Seo.tsx](./src/components/seo/Seo.tsx)
- lazy loading of heavy previews and media

Public SEO helpers live in [src/lib/seo.ts](./src/lib/seo.ts), with static crawl files in:

- [public/robots.txt](./public/robots.txt)
- [public/sitemap.xml](./public/sitemap.xml)

### 3. Auth and User Session

[src/context/AuthContext.tsx](./src/context/AuthContext.tsx) initializes the Supabase client lazily and keeps the current user in React context.

Supporting files:

- [src/context/auth-context.ts](./src/context/auth-context.ts)
- [src/context/useAuth.ts](./src/context/useAuth.ts)
- [src/lib/supabase.ts](./src/lib/supabase.ts)

### 4. Dashboard

The dashboard surface starts in [src/pages/Dashboard.tsx](./src/pages/Dashboard.tsx). It coordinates:

- resume listing and deletion
- resume upload and parse flow
- dashboard navigation
- profile and settings sections

Dashboard UI lives under [src/components/dashboard](./src/components/dashboard), while query/state logic is split into:

- [src/hooks/useResumes.ts](./src/hooks/useResumes.ts)
- [src/hooks/dashboard](./src/hooks/dashboard)
- [src/lib/dashboard](./src/lib/dashboard)
- [src/lib/queries](./src/lib/queries)

### 5. Builder

The main builder entry is [src/components/builder/BuilderPage.tsx](./src/components/builder/BuilderPage.tsx).

It is composed from:

- header actions
- editor workspace
- live preview
- AI workflow modal

Important builder modules:

- [src/components/builder](./src/components/builder)
- [src/hooks/builder](./src/hooks/builder)
- [src/lib/builder](./src/lib/builder)
- [src/store/builderStore.ts](./src/store/builderStore.ts)
- [src/store/builderPersistence.ts](./src/store/builderPersistence.ts)

The builder uses:

- local persisted state through Zustand
- schema validation around imported and persisted data
- print/export payload helpers
- AI workflow entry points tied to the current resume data

### 6. Domain Models

The codebase keeps shared resume and template concepts under [src/domain](./src/domain):

- [src/domain/resume](./src/domain/resume)
- [src/domain/templates](./src/domain/templates)
- [src/domain/workflows](./src/domain/workflows)

These modules define reusable types, defaults, normalization rules, and catalogs that are shared between UI and infrastructure code.

### 7. Schemas and Runtime Validation

Zod schemas live under [src/schemas](./src/schemas) and are used to validate:

- builder payloads and route state
- persisted builder state
- resume records
- AI responses
- parser responses
- profile imports

Runtime validation reporting lives in [src/lib/observability](./src/lib/observability).

This is important because a lot of the app moves data across boundaries:

- browser to serverless API
- Supabase rows to client state
- AI provider responses to structured UI state
- persisted local state back into the app

### 8. Serverless and Edge Runtime

There are two Vercel serverless endpoints under [api](./api):

- [api/parse-resume.ts](./api/parse-resume.ts)
  Parses uploaded PDF resumes on the server after authenticating the user.

- [api/export-pdf.ts](./api/export-pdf.ts)
  Launches Chromium, opens the print route, injects export payload data, and returns a generated PDF.

There is one Supabase Edge Function:

- [supabase/functions/gemini-proxy/index.ts](./supabase/functions/gemini-proxy/index.ts)
  Authenticates the caller, enforces request-slot and credit rules, calls Gemini, and returns structured AI output text.

Schema and deployment config for that edge function lives in:

- [supabase/functions/gemini-proxy/deno.json](./supabase/functions/gemini-proxy/deno.json)
- [supabase/functions/gemini-proxy/.npmrc](./supabase/functions/gemini-proxy/.npmrc)

### 9. Database Migrations

Supabase SQL migrations are stored in [supabase/migrations](./supabase/migrations).

Recent responsibilities include:

- baseline remote schema
- AI credit limit enforcement
- Pro waitlist tracking
- AI request rate limiting

## Directory Guide

Top-level directories you will touch most often:

- `src/components`
  Visual building blocks for landing, dashboard, builder, legal, and shared UI.

- `src/context`
  Auth and plan context providers and hooks.

- `src/data`
  Static content used by landing sections and dashboard views.

- `src/domain`
  Shared business models and normalized resume/template definitions.

- `src/hooks`
  Feature hooks for dashboard, builder, media behavior, and utility state.

- `src/lib`
  Side-effecting integrations and feature logic for parsing, AI, export, dashboard queries, storage, auth, and SEO.

- `src/pages`
  Route-level containers.

- `src/schemas`
  Zod schemas for external and persisted data boundaries.

- `src/store`
  Builder state and persistence helpers.

- `src/types`
  UI-facing TypeScript types that are still used outside the domain layer.

- `api`
  Vercel serverless API handlers.

- `supabase/functions`
  Deno edge functions.

- `supabase/migrations`
  SQL migration history.

- `tests`
  Node-based test files for schemas, request controls, storage, and state logic.

## Main Data Flows

### Upload and Parse Resume

1. User uploads a PDF from the dashboard.
2. [src/pages/Dashboard.tsx](./src/pages/Dashboard.tsx) calls `parseResumeFile`.
3. [src/lib/resumeParser.ts](./src/lib/resumeParser.ts) tries the authenticated server parse endpoint.
4. [api/parse-resume.ts](./api/parse-resume.ts) extracts text and returns structured resume data.
5. Parsed data is passed into the builder route state.
6. Builder schemas validate the incoming route state before hydration.

### AI Workflow Request

1. Builder triggers an AI action.
2. Client logic in [src/lib/gemini.ts](./src/lib/gemini.ts) prepares prompts and caches requests.
3. Requests go through the `gemini-proxy` edge function.
4. The edge function validates the JWT, reserves a request slot, consumes a credit, calls Gemini, and returns text.
5. Client-side schemas validate the AI response before it reaches UI state.

### PDF Export

1. Builder sends export data to [api/export-pdf.ts](./api/export-pdf.ts).
2. The API validates the request payload.
3. Playwright opens `/print/resume`.
4. Export payload is injected into the page before load.
5. [src/pages/ResumePrintPage.tsx](./src/pages/ResumePrintPage.tsx) resolves the payload and renders the printable document.
6. Chromium generates the PDF and returns it as a download.

## Environment Variables

Client:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SITE_URL`

Vercel serverless API routes:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `APP_URL` or `SITE_URL`
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` or `CHROME_EXECUTABLE_PATH` for some local export setups

Supabase Edge Function secrets:

- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Notes:

- The client will throw on startup if `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing.
- PDF export expects a trusted application origin in production.
- The Gemini edge function requires both the provider API key and Supabase service-role access.

## Local Development

### Prerequisites

- Node.js 22.x
- npm
- a Supabase project
- a configured `.env`
- Chrome or Chromium installed locally if you want to exercise the PDF export route outside production

### Install

```sh
npm install
```

### Run the app

```sh
npm run dev
```

### Production build

```sh
npm run build
```

### Preview the production build

```sh
npm run preview
```

### Lint

```sh
npx eslint .
```

### Run schema and state tests

```sh
npm run test:schemas
```

## VS Code and Deno

The repo includes `.vscode` settings to enable Deno tooling inside `supabase/functions`. Keep those if you edit the edge function locally.

Relevant files:

- [.vscode/extensions.json](./.vscode/extensions.json)
- [.vscode/settings.json](./.vscode/settings.json)

## Deployment

### Vercel

[vercel.json](./vercel.json) configures:

- serverless function resource limits
- routing of `/api/*`
- SPA fallback to `index.html`

### Supabase

You will need:

- the project database and auth config
- applied migrations from `supabase/migrations`
- deployed edge function `gemini-proxy`
- required secrets configured in the Supabase project

## Performance and SEO Notes

Recent work in the public app includes:

- separating public routes from auth-gated app providers
- route-level SEO metadata
- sitemap and robots support
- lazy loading of heavy preview code
- earlier media loading for landing demos

Remaining heavy assets, especially landing videos and large screenshots, are still the main performance bottleneck.

## Suggested Onboarding Path

If you are new to the codebase, read in this order:

1. [src/main.tsx](./src/main.tsx)
2. [src/App.tsx](./src/App.tsx)
3. [src/components/app/ProtectedAppLayout.tsx](./src/components/app/ProtectedAppLayout.tsx)
4. [src/pages/LandingPage.tsx](./src/pages/LandingPage.tsx)
5. [src/pages/Dashboard.tsx](./src/pages/Dashboard.tsx)
6. [src/components/builder/BuilderPage.tsx](./src/components/builder/BuilderPage.tsx)
7. [src/lib/resumeParser.ts](./src/lib/resumeParser.ts)
8. [src/lib/gemini.ts](./src/lib/gemini.ts)
9. [api/export-pdf.ts](./api/export-pdf.ts)
10. [supabase/functions/gemini-proxy/index.ts](./supabase/functions/gemini-proxy/index.ts)

## License

MIT @ ResumeeNow.
