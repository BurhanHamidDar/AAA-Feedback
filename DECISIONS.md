# Technical Decisions — AAA Feedback

This file records all significant architectural and technical decisions made during development, including the context, options considered, and rationale. This serves as the institutional memory for the project.

---

## ADR-001: Monorepo with pnpm Workspaces + Turborepo

**Date:** 2026-06-09  
**Status:** Accepted

### Context
The system has three distinct packages: a Next.js dashboard, an Express.js backend, and shared TypeScript types/schemas. These need to share code without duplication.

### Options Considered
1. Separate repositories — simple but requires publishing shared package or symlinks
2. Monorepo with npm workspaces — built-in but slow
3. Monorepo with pnpm workspaces + Turborepo — fast installs, build caching, parallel tasks

### Decision
**pnpm + Turborepo.** pnpm's strict node_modules layout avoids phantom dependency issues. Turborepo provides intelligent build caching and parallel task execution, critical for a multi-package repo.

---

## ADR-002: Next.js 15 App Router for Dashboard

**Date:** 2026-06-09  
**Status:** Accepted

### Context
The dashboard is an authenticated admin application. Server components, streaming, and file-based routing are all beneficial.

### Options Considered
1. Vite + React SPA — simpler but no SSR, no file-based routing
2. Next.js 14 Pages Router — stable but older pattern
3. Next.js 15 App Router — latest, server components, streaming

### Decision
**Next.js 15 App Router.** The dashboard benefits from server-side rendering of the initial state, and the App Router's layout system is ideal for the authenticated shell with sidebar. Vercel deployment is seamless.

---

## ADR-003: shadcn/ui over a Full Component Library

**Date:** 2026-06-09  
**Status:** Accepted

### Context
The UI must feel premium and professional (Linear/Vercel quality). A generic component library like Chakra or MUI would produce a generic-looking result.

### Options Considered
1. Material UI — generic, hard to customize, recognizable as "MUI"
2. Chakra UI — better, still generic feel
3. shadcn/ui — unstyled primitives, components copied into codebase, full control
4. Headless UI + manual styling — maximum control but slower

### Decision
**shadcn/ui.** Components are copied into the project, giving full ownership. The Radix UI primitives underneath handle accessibility. Combined with a custom Tailwind design system, we get premium aesthetics with zero compromise on accessibility.

---

## ADR-004: Supabase for Database + Auth

**Date:** 2026-06-09  
**Status:** Accepted

### Context
Need a PostgreSQL database with authentication, row-level security, and a managed service to reduce operational overhead.

### Options Considered
1. PlanetScale + custom auth — MySQL, not ideal for complex queries
2. Neon + NextAuth — good combo but more setup
3. Supabase — PostgreSQL + Auth + RLS + realtime, one service

### Decision
**Supabase.** The combination of PostgreSQL (with RLS for security), built-in Auth with JWT, and the JavaScript SDK makes this the fastest path to a secure, production-grade database. RLS ensures data access rules are enforced at the database level.

---

## ADR-005: Cloudflare R2 for File Storage

**Date:** 2026-06-09  
**Status:** Accepted

### Context
Evidence files (images, screenshots) must be stored outside the database. Storage costs and egress fees matter.

### Options Considered
1. AWS S3 — industry standard but egress fees are expensive
2. Supabase Storage — convenient but limited free tier
3. Cloudflare R2 — S3-compatible, zero egress fees, 10GB free

### Decision
**Cloudflare R2.** Zero egress fees make it ideal for serving images in the dashboard. S3-compatible API means we use the standard AWS SDK with just an endpoint change. Only URLs are stored in the database.

---

## ADR-006: OpenRouter with Qwen Primary and DeepSeek Fallback for AI

**Date:** 2026-06-09  
**Status:** Accepted (Updated in Phase 3)

### Context
Every feedback submission needs AI analysis (summary, category, sentiment, priority). The system must be resilient to API failures, timeouts, or format drift, and should keep costs minimal using free-tier models on OpenRouter.

### Options Considered
1. **Single Model (Gemini Flash 1.5)** — fast and reliable, but vulnerable if API keys/tokens rate limits are hit.
2. **Qwen primary with DeepSeek fallback via OpenRouter** — utilizes high-quality free models (`qwen/qwen3:free` and `deepseek/deepseek-chat-v3:free`), retrying transparently on failure.
3. **Local LLM** — costly server overhead, slow response times.

### Decision
**OpenRouter with `qwen/qwen3:free` as primary and `deepseek/deepseek-chat-v3:free` as fallback.** 
We implement a robust fallback retry mechanism in the AI service layer. If the primary model fails or times out, the system automatically retries using the fallback model. If both fail, the system falls back to default safe mock values (e.g. Category: `General`, Sentiment: `Neutral`, Priority: `Medium`, Summary: `AI summary unavailable.`) to ensure the submission itself never fails. All results are validated server-side to match capitalized database constraints.

---

## ADR-007: Anonymous Feedback — No Identity Storage

**Date:** 2026-06-09  
**Status:** Accepted

### Context
For anonymous submissions, we must guarantee complete anonymity. This is a trust requirement for users to submit sensitive feedback.

### Options Considered
1. Store then delete after processing — risk of data breach during window
2. Hash the phone number — still linkable if hash is compromised
3. Never store any identity — cleanest, most trustworthy

### Decision
**Never store any identity for anonymous submissions.** The WhatsApp phone number is used only to continue the bot conversation (held in memory/session during submission), then discarded. Nothing is written to the database. This is the only approach that provides genuine anonymity.

---

## ADR-008: Express.js over Fastify/Hono for Backend

**Date:** 2026-06-09  
**Status:** Accepted

### Context
Need a Node.js API framework. Performance at this scale (1400 users, low concurrent requests) is not the primary concern.

### Options Considered
1. Fastify — faster than Express, TypeScript-native, more complex
2. Hono — very fast, edge-compatible, newer ecosystem
3. Express.js — mature, vast middleware ecosystem, easy to maintain

### Decision
**Express.js.** Given the team size (solo developer) and scale (small institution), Express's maturity and ecosystem (express-rate-limit, multer, etc.) outweigh the marginal performance benefits of Fastify or Hono. Code is easier to maintain and there are fewer surprises.

---

## ADR-009: AI Processing is Asynchronous

**Date:** 2026-06-09  
**Status:** Accepted

### Context
AI processing (OpenRouter API call) takes 1–5 seconds per submission. WhatsApp webhook responses must be fast (< 5 seconds or Meta retries).

### Decision
**Async AI processing.** When a WhatsApp webhook arrives:
1. Save raw feedback to DB immediately (status: `new`, `ai_processed_at: NULL`)
2. Respond to Meta webhook immediately (200 OK)
3. Trigger AI processing as a background job
4. Update DB with AI results when complete

The dashboard shows a "Processing..." state for unprocessed feedback and uses React Query to poll for updates.

---

## ADR-010: Duplicate Detection via Embedding Similarity

**Date:** 2026-06-09  
**Status:** Planned (Phase 6)

### Context
Multiple users often report the same issue (e.g., "bus is late"). These should be grouped into clusters rather than shown as 50 separate items.

### Decision
**Text embedding + cosine similarity.** Use OpenRouter embeddings to convert feedback text to vectors. Compare new submissions against existing cluster centroids. If similarity > threshold (0.85), add to existing cluster. Otherwise, create new potential cluster. Clusters with 3+ reports are surfaced to the Principal as "Recurring Issues."

Exact threshold will be tuned based on real data after WhatsApp integration is live.

---

## ADR-011: Admission Number Verification System

**Date:** 2026-06-09  
**Status:** Accepted (Phase 8)

### Context
To prevent external or unauthorized submissions, we need to verify that only genuine Ayesha Ali Academy students and parents can submit feedback, while still preserving anonymity choices.

### Options Considered
1. **Full verification** — Verify name, date of birth, parent phone number, and OTP. High friction, complex to implement, and high risk of user dropoff.
2. **OTP verification only** — Standard but requires SMS gateways (expensive, complex delivery inside India).
3. **Admission Number verification alone** — Quick, simple, and secure. Admission numbers are unique and hard to guess (e.g. `AAA19/GI/0270`).

### Decision
**Admission Number Verification alone.** For Version 1, verifying the Admission Number against the official `students` registry is sufficient. It has zero cost, low user friction, and stops external spam effectively.

---

## ADR-012: Rate-Limiting and Block Strategy for Student Verification

**Date:** 2026-06-09  
**Status:** Accepted (Phase 8)

### Context
Since Admission Number verification is simple, we must prevent brute-force attacks from guessing valid admission numbers.

### Options Considered
1. **IP-based rate limiting** — Ineffective for WhatsApp requests since they all come from Meta Cloud API IP addresses.
2. **Phone-number-based rate limiting** — Enforce rate limits on each individual WhatsApp phone number.
3. **Captcha** — Not supported in standard WhatsApp text conversations.

### Decision
**Phone-number-based rate limiting in a database session table.** 
We store session status in `whatsapp_sessions`. If a phone number fails verification, we increment a `failed_attempts` counter. 
Upon reaching 5 failures in a day, subsequent attempts from that number are blocked for 24 hours (recorded in `blocked_until`). Every attempt (success or failure) is logged to `audit_logs` for compliance review.

---

## ADR-013: Phase 4 Analytics & Reporting Engine

**Date:** 2026-06-09  
**Status:** Accepted (Phase 4)

### Context
To support institutional decision making, the Principal must be able to view high-level feedback counts, category/sentiment distributions, status tracking, and resolution health. In addition, the Principal needs to export high-quality branded PDF documents and detailed Excel spreadsheets.

### Options Considered
1. **Ad-hoc SQL Queries**: Query the database using separate `COUNT(*)` queries for every chart, card, and metric. (High database round-trip latency, inefficient).
2. **In-Memory Aggregation**: Fetch a single lightweight array of metadata (containing only timestamps, status, category, sentiment, priority, and ids) and aggregate the breakdowns dynamically in Node.js memory.
3. **Database Views & Aggregations**: Materialized views or complex SQL functions. (Adds schema maintenance complexity, harder to filter dynamically).

### Decision
**In-Memory Aggregation with Single Metadata Query.** We fetch lightweight columns in a single Supabase query and aggregate them in Node.js memory. This reduces the number of queries from 10+ to 1, providing sub-millisecond aggregation times for thousands of records.

We also added a `resolved_at` column to the `feedback` table and a database trigger `feedback_resolved_at_trigger` to set this timestamp automatically when status transitions to `resolved`. This ensures accurate resolution time metrics without relying on application-level timestamp writing.

For exports, we stream the output generated by `pdfkit` (PDFs formatted according to school branding with headers, mottos, and summaries) and `exceljs` (Excel workbooks with multiple structured sheets) directly through authenticated Axios client-side blob fetches. This maintains strict access control via JWT authorization headers without leaking credentials in query strings.

---

## ADR 8: WhatsApp Web Pilot Strategy & Messaging Abstraction

### Status
Accepted (June 2026)

### Context
Meta WhatsApp Business API credentials and approval can take weeks to configure. To accelerate development, run local demonstrations, and launch a pilot version at Ayesha Ali Academy, we need a functional WhatsApp bot that operates on a standard dedicated SIM number without waiting for Meta approvals. 

### Options Considered
1. **Meta WhatsApp Cloud API (Blocked/Postponed)**: Waiting for institutional Meta business verification.
2. **Third-Party Twilio/WABA wrappers (Costly/Rigid)**: Adds operational costs, requires custom numbers.
3. **whatsapp-web.js (Selected for Pilot)**: Uses a local web-scraping wrapper (headless Chromium) via WhatsApp Web. Zero cost, works with any normal SIM card, runs locally on localhost without tunnels.

### Decision
We will temporarily implement `whatsapp-web.js` with `LocalAuth` session storage for pilot runs. To prevent coupling the codebase to this library, we created a transport-agnostic `MessagingService` abstraction interface:
- **Abstraction layer**: Primitives like `sendMessage` and `onMessageReceived` are interface-driven. 
- **In-Memory States**: Active chat conversation state flows are maintained in-memory for simplicity during the pilot phase, while student verification mapping (mapping phone numbers to student records) is stored permanently in the database so parents only have to verify once.
- **Duplicate Protection**: Enforced in-memory with a 5-minute sliding window per user.
- **Administrative Collection Status**: Managed via a `system_settings` database table, allowing administrators to shut off feedback collection from their Settings dashboard while leaving status-tracking functional.

When moving to the Meta Cloud API later, we only need to implement a new transport class conforming to the `MessagingService` interface. No business logic or database operations will need to change.

---

## ADR-014: Decoupling Student Verification and Feedback Submitter Role

**Date:** 2026-06-11  
**Status:** Accepted (Phase 11)

### Context
AAA Feedback was originally designed around the assumption that the submitter is always a student. However, parents and guardians are expected to be the largest source of feedback. We need to support them as first-class users without forcing them to create accounts or integrating complex ERP schemas, while maintaining student relationships and anonymous feedback properties.

### Options Considered
1. **Full Parent Accounts & ERP Integration**: Require parents to register accounts and map them via an ERP parent-student link table. (High complexity, high friction, delayed rollout).
2. **Decoupled Verification Flow (Selected)**: Keep the Admission Number check as proof of a legitimate school relationship. Ask the user who they are (Student, Parent, Guardian) on submission, and record `parent_name` / `guardian_name` / `parent_phone` / `guardian_phone` directly inside the `students` table, and a `submitter_type` ('Student', 'Parent', 'Guardian', 'Unknown') field inside the `feedback` table.

### Decision
**Decoupled Verification Flow.** 
By separating the *relationship* (which admission number proves) from the *submitter*, we can support Parents/Guardians as first-class citizens. 

- **WhatsApp bot update**: Inserts a role selection check after admission verification. Allows users to clarify whether they are a Student, Parent, or Guardian.
- **Database updates**: Added `submitter_type` enum constraints on the `feedback` table, and optional parent/guardian registration fields on the `students` table.
- **Anonymity protection**: If feedback is submitted anonymously, we strip student name, student phone, and ERP parent/guardian fields from database views exposed to non-principal admins, but retain the submitter type (e.g. displaying as "Anonymous Parent" or "Anonymous Student").
- **Dashboard UI**: Displays a colored badge for submitter roles, allows filtering by Submitter Type, and includes a **Submitter Role Distribution** donut chart in the Analytics panel.

---

## ADR-015: Parent-First Verification & Multi-Contact Redesign

**Date:** 2026-06-11  
**Status:** Accepted (Redesign)

### Context
School management noted that most parents do not remember their child's admission number. Forcing them to enter admission numbers creates unnecessary friction and drops feedback volume. We need a frictionless parent welcome flow that recognizes parents immediately via their WhatsApp phone number.

### Decision
Implement the **Parent-First Verification System**:
1. **Multi-Contact Database Architecture**: Create a new table `public.student_contacts` mapping students to parent contacts. It supports one-to-many parent-student links (Father, Mother, Guardian, Other) and many-to-one mapping (same phone number linked to multiple children in the school).
2. **Safe Migration Strategy**: Retain nullable legacy parent columns in the `students` table, migrate them to `student_contacts` table, verify integrity, and only consider legacy column removal post-verification.
3. **Parent-First Bot Flow**: Incoming WhatsApp messages search `student_contacts` by phone. If found, the user enters the Parent welcome menu directly. If not, they are asked if they are a student and go to student verification (Admission Number check).
4. **General & Multiple Children Scopes**: Support feedback scopes: `student_specific` (student ID linked), `multiple_students` (applies to multiple children, student ID NULL), and `general_school` (student ID NULL).
5. **Anonymous Policy Update**: Preserve complete references (parent names, numbers, student IDs) inside the database for audit trails, analytics, and abuse prevention. Mask all identifying details on the Express API serialization layer for any anonymous submissions, so they remain fully hidden on the Dashboard frontend.
6. **Reference Refactoring**: Updated tracking number sequence trigger to output the `FB-` prefix (e.g. `FB-2026-000125`).
7. **Administrative Global Toggle**: Implement setting toggle "Enable Feedback Collection". If disabled, new feedback submissions are blocked (informing the user with a custom bot message), while help/tracking services continue to function.



