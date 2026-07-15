# Changelog — AAA Feedback

All notable changes to AAA Feedback are documented here.  
Format: [Version] — Date — Description

---

## [1.2.2] — 2026-07-16 — Fix: WhatsApp Client Stability & Singleton Guard

### Fixed
- **`window['onQRChangedEvent'] already exists` error**: Added an `isInitialized` singleton guard to `WhatsAppWebService.initialize()`. Calling `initialize()` while a client is already running now logs a warning and returns immediately, preventing duplicate Puppeteer event listener registration.
- **Silent bot death after disconnect**: Added a `disconnected` event handler. When WhatsApp drops the session for any reason (network flap, phone logout, server wake), the broken client is destroyed cleanly and a fresh client is reconnected automatically after 30 seconds — without requiring a PM2 restart.
- **`auth_failure` recovery**: `auth_failure` events now also trigger the reconnect loop instead of leaving the bot in a broken state.
- **`Execution context was destroyed` errors**: Fixed by making client creation lazy (inside `initialize()`, not the constructor) and by calling `client.removeAllListeners()` + `client.destroy()` before rebuilding. This ensures Puppeteer never attempts to operate on a stale browser context.
- **PM2 `exec_mode` made explicit**: Added `exec_mode: 'fork'` to `ecosystem.config.js`. Without this, a future `pm2 scale` could accidentally spin up cluster-mode workers that share the same `LocalAuth` session folder, causing all of the above errors simultaneously.

### Changed
- WhatsApp `initialize()` no longer calls `process.exit(1)` on failure. The internal reconnect loop handles recovery; the HTTP API stays available during reconnect attempts.
- Added `--single-process` Puppeteer flag to reduce memory usage and avoid zygote-process crashes on Oracle Cloud's constrained ARM instances.
- Added `kill_timeout: 5000` and `restart_delay: 3000` to PM2 config for graceful Puppeteer shutdown and to prevent rapid crash–restart loops.
- All WhatsApp lifecycle log messages are now prefixed with `[WA]` for easy log filtering.

## [1.2.1] — 2026-07-16 — Fix: Parent Phone Verification Normalization

### Fixed
- **Parent Phone Verification Bug**: Fixed the issue where all incoming WhatsApp numbers were treated as unregistered because of number formatting (spaces, dashes, brackets) and country code (+91) mismatches.
- **Robust Phone Normalization**: Created a reusable `normalizePhoneNumber` and `phoneNumbersMatch` utility in `apps/backend/src/utils/phone.ts`.
- **Database Lookup Realignment**: Updated the parent phone lookup in `feedbackBot.ts` and `routes/feedback.ts` to query the registry `students` table directly (matching `parent_phone` and `guardian_phone` columns) and normalize numbers on both sides before comparison.

## [1.2.0] — 2026-06-11 — Verification Redesign: Parent-First Flow

### Added
- Implemented **Parent-First Verification System**: Auto-identifies parents by phone against `student_contacts`, bypassing Admission Number entry.
- Created `student_contacts` table supporting One Student -> Many Contacts and One Contact -> Many Students.
- Migrated flat parent/guardian registry details from `students` to `student_contacts`.
- Added support for three feedback scopes: `student_specific`, `multiple_students`, and `general_school`.
- Updated anonymous data policy to retain student/contact references in the database, but strictly mask them on the Express API serialization layer before sending to the dashboard.
- Refactored tracking reference number format to use the `FB-` prefix (e.g., `FB-2026-000125`).
- Integrated settings collection toggle ("Enable Feedback Collection") in the bot to immediately block new submissions when disabled, keeping tracking/help operational.
- Updated dashboard feedback lists and details views to show Submitter Type, Submitter Relationship, and Feedback Scope.
- Expanded the Analytics page with **Feedback Scope** and **Parent Relationship** distribution charts.

## [1.1.0] — 2026-06-11 — Phase 11: Parent & Guardian Support

### Added
- Decoupled student verification from the submitter role in the WhatsApp bot flow, allowing Parents and Guardians to submit feedback as first-class users.
- Introduced `submitter_type` field ('Student', 'Parent', 'Guardian', 'Unknown') to the `feedback` table schema and backend endpoints.
- Expanded the `students` table schema with optional registry contact details (`parent_name`, `parent_phone`, `guardian_name`, `guardian_phone`).
- Implemented a submitter role filter in the dashboard listings and added role badges (`Student`, `Parent`, `Guardian`) in the feedback table.
- Added support for displaying registered parent/guardian ERP details in the feedback details sidebar.
- Added a **Submitter Role Distribution** pie chart to the Analytics dashboard panel.

## [1.0.0] — 2026-06-10 — Phase 5: WhatsApp Web Integration

### Added
- Integrated `whatsapp-web.js` with `LocalAuth` to bootstrap the pilot WhatsApp bot.
- Extracted generic `MessagingService` transport layer to decouple all business bot logic from WhatsApp-specific libraries.
- Implemented in-memory conversation state machine mapping users through greetings, verification, feedback types, text descriptions, evidence, and tracking lookups.
- Implemented duplicate feedback protection (5-minute sliding window filter per phone).
- Added permanent WhatsApp-to-student verification mapping check, allowing verified numbers to bypass admission checks.
- Exposed `/api/settings` GET/POST endpoints and created the database-backed `system_settings` table to allow remote toggle controls.
- Designed administrative control panel in the dashboard Settings page to enable/disable feedback collection.
- Refined confirmation acknowledgement response formatting for completed submissions.

### Fixed
- Fixed monorepo ESM/CJS exports routing paths in `packages/shared/package.json` to resolve TS compilation errors.
- Improved Axios network error handler on dashboard login form.

## [0.9.0] — 2026-06-09 — Phase 4: Analytics & Reporting

### Added
- Database schema changes: `resolved_at` TIMESTAMPTZ column and automated trigger `feedback_resolved_at_trigger` on the `feedback` table
- Backend endpoints: `GET /reports/analytics` (aggregated trends and resolution stats), `GET /reports/export/pdf` (school-branded executive digest), and `GET /reports/export/excel` (tabular Excel sheet)
- Client-side blob downloader helper avoiding credentials leakage in URL query parameters
- Interactive Reports section in the dashboard showing date range presets, advanced custom filters, dynamic previews, and download buttons
- Analytics Dashboard section displaying interactive Recharts Area/Pie/Bar visual charts, resolution speed statistics, and category frequency lists

### Changed
- Updated sidebar layout navigation links and Lucide icons (added TrendingUp for Analytics, updated FileText for Reports)

## [0.8.0] — 2026-06-09 — Phase 8: Admission Number Verification System

### Added
- Database tables: `public.students` (student registry registry) and `public.whatsapp_sessions` (verification session state)
- Row-level security (RLS) policies and triggers for the new tables
- Zod schema `VerifyAdmissionSchema` and types in `@aaa-feedback/shared`
- Endpoint `POST /api/verification/verify` with rate-limiting lock (max 5 failed attempts/day per phone)
- Database schema changes on `feedback` table to associate verified student IDs, verification statuses, and is_anonymous flags
- Masking logic at the Express API layer to prevent leaking verified student information for anonymous feedback
- Dashboard UI changes on feedback tables and details views to show student details (Name, Class, Section, Admission No) or a "Verified Student (Hidden)" badge

### Changed
- Refactored `@aaa-feedback/shared` package build and dev scripts to emit declarations using `tsc` to bypass type resolution bugs

## [0.1.0] — 2026-06-09 — Phase 1: Foundation

### Added
- Monorepo structure with pnpm workspaces and Turborepo
- `packages/shared` — TypeScript types, Zod schemas, shared constants
- `apps/backend` — Express.js skeleton with auth middleware, rate limiting, route stubs
- `apps/dashboard` — Next.js 15 with Tailwind CSS, shadcn/ui, design system
- Login page with professional design
- Dashboard layout with collapsible sidebar
- Dashboard overview page with KPI card placeholders
- Supabase PostgreSQL schema (all tables + RLS policies)
- Health check endpoint (`GET /health`)
- All project documentation files
- `.env.example` files for both apps

## [0.3.0] — 2026-06-09 — Phase 3: AI Integration

### Added
- Modular AI service layer `apps/backend/src/services/ai/analyzeFeedback.ts` calling OpenRouter
- Primary LLM model: `qwen/qwen3:free`
- Fallback LLM model: `deepseek/deepseek-chat-v3:free` with automatic retries on timeout/errors
- Safe AI defaults on total failure (`AI summary unavailable.`, `General`, `Neutral`, `Medium`)
- Asynchronous non-blocking AI processing queued immediately upon public submission
- Capitalized enums in database check constraints and shared TypeScript types/constants
- Multi-filtering capabilities on Dashboard table allowing comma-separated queries in category, priority, and sentiment
- Public `POST /api/feedback` submission route
- Custom premium `MultiSelect` checkbox dropdown components in `FeedbackFilters`
- System audit logs tracking `ai_reprocessed` events with old/new values

### Changed
- Refactored database schema columns to remove `ai_` prefixes (`summary`, `category`, `sentiment`, `priority`, `ai_processed`)
- Updated Next.js lists and details components to query new prefix-less database columns

---

## [0.2.0] — 2026-06-09 — Phase 2: Feedback Management & Rebranding

### Added
- Feedback detail page showing timeline, evidence gallery, internal comments, and AI classifications
- Status workflow stepper and comment threads with audit logging
- Presigned uploads for attachments via Cloudflare R2
- Feedback list page with full pagination, table, skeleton loaders, and empty states

### Changed
- Rebranded dashboard styling system to Ayesha Ali Academy institutional theme (Gold/Navy/Academic light theme)
- Added school motto ("Above & Ahead") and official logo to sidebar and login pages
- Restyled dashboard charts and components to align with brand guidelines

---

*Future releases will be documented here as development progresses.*
