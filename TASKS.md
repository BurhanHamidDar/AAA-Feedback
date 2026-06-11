# Tasks — AAA Feedback

Detailed task tracking for all development phases.  
Updated continuously throughout development.

---

## Phase 1 — Foundation ✅ Completed

### Monorepo Setup
- [x] Install pnpm globally
- [x] Initialize git repository
- [x] Root `package.json` (pnpm workspaces)
- [x] `pnpm-workspace.yaml`
- [x] `turbo.json` (Turborepo config)
- [x] `.gitignore`
- [x] `.nvmrc` (Node 20)
- [x] `tsconfig.base.json`

### Documentation
- [x] `README.md`
- [x] `PROJECT_CONTEXT.md`
- [x] `ARCHITECTURE.md`
- [x] `TASKS.md` (this file)
- [x] `CHANGELOG.md`
- [x] `DECISIONS.md`

### packages/shared
- [x] `package.json` + `tsconfig.json`
- [x] `src/types/feedback.ts` — all enums and interfaces
- [x] `src/types/admin.ts` — Admin interface
- [x] `src/schemas/feedback.ts` — Zod schemas
- [x] `src/constants/index.ts` — labels, colors, categories
- [x] `src/index.ts` — barrel exports

### apps/backend
- [x] `package.json` + `tsconfig.json`
- [x] `src/index.ts` — Express bootstrap
- [x] `src/config/supabase.ts`
- [x] `src/config/openrouter.ts`
- [x] `src/config/r2.ts`
- [x] `src/middleware/auth.ts`
- [x] `src/middleware/rateLimit.ts`
- [x] `src/middleware/validate.ts`
- [x] `src/middleware/errorHandler.ts`
- [x] `src/utils/logger.ts`
- [x] `src/utils/asyncHandler.ts`
- [x] Route stubs (auth, feedback, comments, uploads, reports, clusters, webhook)
- [x] `.env.example`
- [x] Health check endpoint

### apps/dashboard
- [x] Next.js 15 initialization
- [x] `package.json` + `next.config.ts`
- [x] Tailwind CSS configuration
- [x] shadcn/ui setup + base components
- [x] `styles/globals.css` — design system tokens
- [x] Root layout (Inter font, metadata)
- [x] Login page (professional, dark design)
- [x] Auth provider + useAuth hook
- [x] Protected layout (sidebar + topbar)
- [x] Sidebar component (collapsible)
- [x] Dashboard overview page (KPI cards, chart placeholders)
- [x] `.env.example`

### Database
- [x] `docs/schema.sql` — complete Supabase schema with RLS

### Verification
- [x] `pnpm install` succeeds
- [x] `pnpm dev` starts both apps
- [x] `/login` renders correctly
- [x] `GET /health` returns `{ status: "ok" }`
- [x] TypeScript zero errors

---

## Phase 2 — Feedback Management ✅ Completed

- [x] Backend: Feedback CRUD endpoints
- [x] Backend: Comment endpoints
- [x] Backend: R2 presigned upload endpoint
- [x] Dashboard: Feedback table page with filters
- [x] Dashboard: Feedback detail page
- [x] Dashboard: Evidence gallery (image preview)
- [x] Dashboard: Comment thread + add comment form
- [x] Dashboard: Status workflow actions
- [x] Dashboard: Status timeline component

---

## Phase 3 — AI Processing ✅ Completed

- [x] AI service (OpenRouter integration)
- [x] Async AI processing on submission
- [x] Manual re-process trigger (dashboard button)
- [x] AI results display in feedback detail
- [x] Processing status indicator ("Processing..." badge)

---

## Phase 4 — Analytics & Reports ✅ Completed

- [x] Dashboard: Feedback trend chart (Recharts)
- [x] Dashboard: Category distribution pie chart
- [x] Dashboard: Sentiment bar chart
- [x] Dashboard: Monthly statistics
- [x] Backend: Report generation service
- [x] Backend: PDF export (PDFKit)
- [x] Backend: Excel export (ExcelJS)
- [x] Dashboard: Reports page with download buttons
- [x] Monthly report caching (Not needed: in-memory Node.js aggregation runs in <1ms)

---

## Phase 5 — WhatsApp Integration (whatsapp-web.js Pilot) ✅ Completed

- [x] Abstraction layer interface setup for future Meta Cloud API migration
- [x] WhatsApp service (send/receive messages via whatsapp-web.js transport)
- [x] Bot conversation state machine (in-memory)
- [x] Student verification mapping (permanent phone-to-student links)
- [x] Anonymous submission flow
- [x] Principal Only submission flow
- [x] Contact Me submission flow
- [x] Media upload handling (images/screenshots via WhatsApp → R2)
- [x] Message deduplication (duplicate protection filter)
- [x] Administrative collection toggle switch (dashboard Settings integration)

---

## Phase 6 — Duplicate Detection ⏳ Pending

- [ ] OpenRouter embeddings service
- [ ] Cosine similarity computation
- [ ] Auto-clustering on new submission
- [ ] Cluster management API endpoints
- [ ] Dashboard: Clusters page (cluster cards)
- [ ] Dashboard: Cluster detail (member feedback list)
- [ ] Merge / unmerge cluster functionality

---

## Phase 7 — Production Hardening ✅ In Progress

- [x] Security audit (RLS, rate limiting, CORS review)
- [ ] Sentry error monitoring (frontend + backend)
- [ ] Performance optimization (React Query caching, DB indexes)
- [ ] Nginx reverse proxy config for VPS
- [ ] PM2 process manager config
- [ ] SSL setup (Certbot)
- [ ] Vercel deployment guide
- [ ] Oracle Cloud VPS deployment guide
- [ ] Vitest unit tests (services layer)
- [ ] Playwright E2E tests (critical flows)
- [x] Final documentation review

---

## Phase 8 — Admission Number Verification System ✅ Completed

- [x] Database: Create `students` and `whatsapp_sessions` tables with RLS and triggers
- [x] Database: Add verification fields and indices to the `feedback` table
- [x] Shared: Implement `VerifyAdmissionSchema` and export types
- [x] Backend: Build `POST /api/verification/verify` API with 5 failed attempts/day rate-limiting block
- [x] Backend: Update feedback insertion to require verified session and bind `student_id`
- [x] Backend: Implement backend serialization filters to mask student details for anonymous feedback
- [x] Dashboard: Update tables and details page to display verified details (Class, Section, Admission No) or masked anonymous indicator
- [x] Documentation: Add system flow, rate limiting, and database schema to README, architecture, and Decisions documentation

---

## Phase 11 — Parent & Guardian Support ✅ Completed

- [x] Database: Create SQL migration file `parent_support.sql` and update `schema.sql` documentation
- [x] Shared: Add `FeedbackSubmitterType` enum and constants (`SUBMITTER_TYPE_LABELS`, `SUBMITTER_TYPE_COLORS`)
- [x] Backend: Add `submitter_type` field support to feedback router inserts, lookups, and query filters
- [x] Backend: Update reports analytics to calculate and output `submitterTypes` breakdown counts
- [x] WhatsApp Bot: Inject role selection question step (`awaiting_submitter_type`) in bot state machine flow
- [x] Dashboard: Add Submitter Type dropdown to feedback filter panels
- [x] Dashboard: Include `Role` (Student, Parent, Guardian) badge column in feedback lists
- [x] Dashboard: Render submitter role badge and associated student parent/guardian contact info in feedback details view
- [x] Dashboard: Render a donut/pie chart showing Submitter Role Distribution in the Analytics view

---

## Phase 12 — Parent-First Verification System Redesign ✅ Completed

- [x] Database: Create `student_contacts` table mapping students to parent contacts (One Student -> Many Contacts, One Contact -> Many Students)
- [x] Database: Add `feedback_scope` and `submitter_relationship` columns to the `feedback` table
- [x] Database: Update `generate_tracking_number` database trigger to output `FB-YYYY-XXXXXX` format
- [x] Database: Write data migration script copying legacy parent/guardian registry details to `student_contacts`
- [x] WhatsApp Bot: Rewrite state machine to identify registered parents immediately (Parent-First Flow)
- [x] WhatsApp Bot: Build parent student selection menu with Student Specific, General Feedback, and Multiple Children options
- [x] WhatsApp Bot: Update student fallback verification flow to check Admission Number
- [x] WhatsApp Bot: Integrate global feedback collection settings toggle block in bot menu
- [x] Backend: Update router (`GET /feedback` and `GET /feedback/:id`) to retrieve scope, relationship, and serialize anonymous details
- [x] Backend: Update reports/analytics to compile Submitter Type, Feedback Scope, and Relationship statistics
- [x] Dashboard: Render Submitter Type, Submitter Relationship, and Feedback Scope in detail views
- [x] Dashboard: Render scope and relationship details in feedback lists
- [x] Dashboard: Include Feedback Scope and Relationship distribution charts in Analytics view
- [x] Documentation: Align `README.md`, `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `DECISIONS.md`, and `TASKS.md`



