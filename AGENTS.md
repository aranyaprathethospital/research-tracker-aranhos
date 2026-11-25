<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Rules

## Product and stack

- This repository is the Research Tracker web app. Use the versions already pinned in `package.json` and `pnpm-lock.yaml`; do not upgrade frameworks or add dependencies as part of an unrelated change.
- The app uses Next.js 16 App Router, React, TypeScript/TSX, Tailwind CSS v4, shadcn/ui built on Base UI, Better Auth, Prisma 7, and PostgreSQL on Supabase.
- Prefer the project's existing libraries where they fit: TanStack Table for data grids, React Hook Form with Zod for validated forms, lucide-react for icons, date-fns for date formatting, Sonner for notifications, Recharts for charts, and Framer Motion or GSAP for purposeful motion. Use Three.js only when a real 3D interaction improves the feature.
- Keep the interface light mode only. Write styling in Tailwind `className` utilities; do not create CSS or SCSS files. Keep pages usable at mobile, tablet, and desktop widths.

## Architecture and file placement

- Keep `app/` focused on routing: route pages, layouts, loading/error boundaries, and API route handlers. Route groups such as `(auth)` and `(workspace)` organize layouts without changing public URLs.
- Put feature-specific UI and workflows in `features/<feature>/components/` (and nearby feature-owned modules when needed). A route `page.tsx` should load/authorize server data, redirect when needed, and render the feature component; do not put a large screen implementation inside the route file.
- Put shared, domain-neutral UI primitives in `components/ui/`. Follow the existing shadcn Base UI conventions and use the existing shared components before introducing another primitive.
- Put server-only domain services, auth, access checks, data access, and shared types in `lib/`. Add `import "server-only"` to modules that must never enter a client bundle.
- Keep Prisma models in `prisma/schema.prisma` and database history in `prisma/migrations/`. Keep operational scripts in `scripts/` and document their environment requirements.
- Use the `@/` path alias and follow the neighboring file's naming, export, and formatting style. Preserve existing route URLs unless a product change explicitly requires a URL change.
- Separate client and server responsibilities. Add `"use client"` only to components that need browser state, event handlers, or client hooks. Never import Prisma, server credentials, or server-only modules into client components.

## UI and interaction rules

- Use semantic HTML, accessible labels, keyboard-operable controls, visible focus states, and clear loading, empty, success, and error states.
- Prefer the installed shadcn/Base UI components and existing Tailwind design tokens. Avoid one-off inline styles and avoid adding a second styling system.
- Use responsive Tailwind breakpoints rather than fixed desktop-only widths. Check long Thai names, labels, and tables at narrow widths.
- Keep animation restrained, respect reduced-motion preferences, and avoid running Framer Motion and GSAP on the same element.
- Keep notifications consistent through Sonner. Do not use browser `alert()` for normal product feedback.

## Data, roles, and authorization

- Better Auth owns application sessions and authentication. Supabase Auth is not the app login provider; PostgreSQL access from the app goes through server-side Prisma.
- ProviderID login is allowlist-based: a matching, active `ResearchProfile` with a previously registered CID lookup key must exist. Do not add automatic account creation from an unknown ProviderID identity.
- Never store or log a plain Thai CID. Use the existing normalization and HMAC lookup helpers in `lib/provider-id.ts`; keep `BETTER_AUTH_SECRET` stable because it is part of the CID lookup fingerprint.
- Enforce access in server code for every page data load and API mutation. Never rely on hidden UI controls, client-supplied roles, or client-supplied work mode as authorization. Use the shared checks in `lib/server-access.ts` and `lib/roles.ts` where applicable.
- Keep system roles (`USER`, `PM`, `SUPERADMIN`) separate from work capabilities (`ADVISEE`, `ADVISOR`). Only Superadmin may assign system roles; PM may manage regular user profiles/capabilities and projects. A user may select only a capability granted to that user's profile.
- A research project has one primary advisor and may have multiple secondary advisors. Keep the database uniqueness constraint and server validation; advisor reviews/comments must remain scoped to assigned projects and each advisor's own review.
- Keep profile photos and signatures in the private `research-profile-files` Supabase Storage bucket. Create authorized, short-lived signed URLs on the server; do not make the bucket public or expose storage secrets. A signature image is profile data and is not an electronic approval.
- Do not expose Supabase secret/service-role keys, database credentials, Better Auth secrets, or MOPH secrets through `NEXT_PUBLIC_*`, client code, logs, or committed files. The current app uses server-side Prisma; if adding Supabase Data API access, enable RLS and write ownership/role-aware policies before granting browser roles access.
- Validate API input at the boundary, prefer Zod schemas for new non-trivial input, and handle unique/foreign-key conflicts as useful user-facing errors. Use Prisma transactions when multiple related writes must succeed together.

## Database and environment changes

- Read application environment variables through `@/lib/env`. Prisma CLI and operational scripts use their validated readers from `config/env.ts`. Add new variables to the appropriate schema and runtime mapping there. Direct `process.env` access belongs only in that file.

- Keep `.env.example` aligned with actual environment-variable names and safe placeholder values. Never read, print, or commit a user's real `.env` values while documenting or debugging.
- `DATABASE_URL` is the runtime PostgreSQL URL (the example uses Supabase transaction pooler port `6543`). `DIRECT_URL` is used by Prisma migrations and the bootstrap script (the example uses Supabase session pooler port `5432`). Preserve both roles when updating database setup.
- Change the Prisma schema first, then create a new Prisma migration using the repository's `db:migrate:dev` workflow in development. Do not edit a migration that may already have been applied; add a forward migration instead. Deploy committed migrations with `pnpm db:migrate`.
- Treat `BETTER_AUTH_SECRET` as persistent deployment data. Rotating it invalidates CID lookup fingerprints for existing profiles and may affect auth sessions; plan a data migration and user impact before changing it.
- Bootstrap variables such as `BOOTSTRAP_SUPERADMIN_CID` are temporary process environment values, never permanent `.env` entries. Use `pnpm db:bootstrap-superadmin` only for the initial Superadmin bootstrap; afterwards use the user-management UI.
- Storage bucket setup belongs to the database migration. Keep the bucket private and preserve the supported image types and size limit unless the upload validation and storage behavior are updated together.

## Next.js and change verification

- Before changing Next.js behavior, routing, caching, forms, server/client boundaries, or build configuration, read the relevant guide under `node_modules/next/dist/docs/` for the installed Next.js version and follow its current conventions.
- Keep this project guidance below the generated Next.js rules block above; do not remove or rewrite that block.
- When asked to verify a change, use the narrowest relevant project command (for example, `pnpm lint`, `pnpm db:generate`, or `pnpm build`). Do not run tests or broad verification commands unless requested.
- Update `README.md` and `.env.example` whenever setup steps, scripts, routes, roles, or required environment variables change.
