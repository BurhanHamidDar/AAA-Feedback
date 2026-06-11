# Architecture — AAA Feedback

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     SUBMITTERS                              │
│              Students & Parents (~1400+)                    │
└─────────────────────────┬───────────────────────────────────┘
                          │ WhatsApp messages
                          ▼
┌─────────────────────────────────────────────────────────────┐
│               Meta WhatsApp Cloud API                       │
│          (Dedicated phone number, bot only)                 │
└─────────────────────────┬───────────────────────────────────┘
                          │ Webhook POST
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API (Express.js + TypeScript)          │
│                   Oracle Cloud VPS / Render                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │  WhatsApp   │  │  Feedback    │  │   AI Service       │ │
│  │  Service    │  │  CRUD API    │  │  (OpenRouter)      │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │  Cluster    │  │  Report      │  │   Upload Service   │ │
│  │  Service    │  │  Service     │  │  (Cloudflare R2)   │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
└──────────┬───────────────────┬───────────────────┬──────────┘
           │                   │                   │
           ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Supabase         │ │ Cloudflare R2    │ │ OpenRouter AI    │
│ PostgreSQL + Auth│ │ File Storage     │ │ (Gemini Flash)   │
└──────────────────┘ └──────────────────┘ └──────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│           Principal Dashboard (Next.js 15)                  │
│                      Vercel                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐ │
│  │   Overview   │ │  Feedback    │ │    Analytics &      │ │
│  │   Dashboard  │ │   Table +    │ │    Reports          │ │
│  │   + KPIs     │ │   Detail     │ │    + Export         │ │
│  └──────────────┘ └──────────────┘ └─────────────────────┘ │
│  ┌──────────────┐ ┌──────────────┐                         │
│  │   Clusters   │ │   Settings   │                         │
│  │   / Dupes    │ │              │                         │
│  └──────────────┘ └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend — `apps/dashboard`

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15 (App Router) | Framework, SSR, routing |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first styling |
| shadcn/ui | Latest | Accessible component primitives |
| Framer Motion | 11.x | Animations and transitions |
| Recharts | 2.x | Charts and data visualization |
| React Hook Form | 7.x | Form state management |
| Zod | 3.x | Schema validation |
| TanStack Query | 5.x | Server state, caching, mutations |
| Axios | 1.x | HTTP client |
| Lucide React | Latest | Icon library |

### Backend — `apps/backend`

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20 LTS | Runtime |
| Express.js | 4.x | HTTP framework |
| TypeScript | 5.x | Type safety |
| Supabase JS | 2.x | Database client + Auth |
| AWS SDK v3 | 3.x | Cloudflare R2 (S3-compatible) |
| Winston | 3.x | Structured logging |
| express-rate-limit | 7.x | Rate limiting |
| Zod | 3.x | Request validation |
| ExcelJS | 4.x | Excel export |
| PDFKit | 0.x | PDF export |
| node-cron | 3.x | Scheduled jobs |

### Shared — `packages/shared`

| Technology | Purpose |
|------------|---------|
| TypeScript | Shared type definitions |
| Zod | Shared validation schemas |

### External Services

| Service | Purpose | Tier |
|---------|---------|------|
| Supabase | PostgreSQL DB + Auth + RLS | Free/Pro |
| Cloudflare R2 | Evidence file storage | Free (10GB) |
| OpenRouter | AI processing (Gemini Flash) | Pay-per-use |
| Meta Cloud API | WhatsApp bot | Free (1000 conversations/month) |
| Vercel | Frontend hosting | Free/Pro |
| Oracle Cloud | Backend VPS | Always Free |

---

## Database Architecture

### Tables

```
admins ──────────────────────── auth.users (Supabase)
    │
    ├── feedback_comments ──── feedback ────── students ─── whatsapp_sessions
    │                              │
    └── audit_logs                 ├── feedback_evidence
                                   │
                                   └── issue_clusters
                                           │
                                           └── reports (cached)
```

### Key Design Decisions

1. **`feedback.submitter_phone` is nullable** — NULL for anonymous, stored (encrypted at app level) for other types
2. **`cluster_id` on feedback** — FK to `issue_clusters`, NULL until clustered
3. **`ai_processed_at` timestamp** — NULL means pending AI processing; used by retry queue
4. **RLS on all tables** — no raw database access; always through authenticated API
5. **`audit_logs` never deleted** — append-only compliance trail
6. **`whatsapp_sessions.student_id` is nullable** — Allows session rows to track failed attempts and rate limit unverified numbers before they successfully link a student ID.
7. **Verification session mapping** — Maps the WhatsApp sender's number to their verified `student_id` from the official student registry.
8. **Express API identity masking** — Strips student relationship details for anonymous submissions before serializing JSON payloads to the frontend dashboard.

### Row Level Security (RLS)

```sql
-- All feedback readable by any authenticated admin
-- submitter_phone + submitter_name: only visible via API layer
-- (API enforces role-based field filtering, not RLS, for flexibility)

-- audit_logs: insert-only for all admins, read for principal role only
```

---

## API Architecture

### Authentication Flow

```
Dashboard Login
      │
      ▼
POST /auth/login (email + password)
      │
      ▼
Supabase Auth verifies credentials
      │
      ▼
Returns JWT access token + refresh token
      │
      ▼
Dashboard stores tokens (httpOnly cookie)
      │
      ▼
All subsequent requests: Authorization: Bearer <token>
      │
      ▼
Backend middleware verifies JWT with Supabase
      │
      ▼
Attaches admin user + role to request context
```

### Request Lifecycle (Feedback Submission via WhatsApp)

```
WhatsApp User sends message
      │
      ▼
Meta Cloud API → POST /webhook/whatsapp
      │
      ▼
WhatsApp Service parses message
      │
      ▼
Lookup Verified Session in `whatsapp_sessions` (rate-limited check)
      │
      ├── [Not Verified] ──► Bot prompts for Admission Number ──► POST /api/verification/verify
      │                                                                  │
      │                                                     [Valid] ◄────┴────► [Invalid (Rate limited/Blocked)]
      │                                                        │
      │                                                        ▼
      │                                                 Link Student ID
      ▼
Prompt for Submitter Role (Student, Parent, Guardian) ──► Stored in session
      │
      ▼
Saves raw feedback to DB (student_id & submitter_type attached, is_anonymous flag set)
      │
      ▼
Triggers async AI processing job
      │
      ▼
AI Service (OpenRouter) → summary, category, sentiment, priority
      │
      ▼
Updates feedback record with AI results
      │
      ▼
Cluster Service checks for similar existing issues
      │
      ▼
Links to existing cluster OR creates new cluster
      │
      ▼
Dashboard shows updated feedback (student details stripped/masked if anonymous)
```

---

## Security Architecture

| Concern | Implementation |
|---------|---------------|
| Authentication | Supabase Auth JWT (RS256) |
| Authorization | Role-based (principal / admin) enforced in API middleware |
| Rate Limiting | express-rate-limit (100 req/15min per IP) |
| Input Validation | Zod schemas on all endpoints |
| File Uploads | Presigned R2 URLs (client uploads directly, never through our API) |
| Anonymous Privacy | Phone/name never stored for anonymous submissions |
| Audit Trail | All status changes + comments logged to audit_logs |
| CORS | Whitelist only dashboard domain |
| Secrets | Environment variables only, never in code |

---

## Deployment Architecture

### Production

```
Vercel (Dashboard)          Oracle Cloud VPS (Backend)
next build + edge runtime   PM2 process manager
Custom domain               Nginx reverse proxy
Automatic CI/CD             SSL via Certbot (Let's Encrypt)
```

### Development

```
localhost:3000 (Next.js dev)
localhost:4000 (Express dev with ts-node-dev)
```

---

## Directory Structure

```
AAA-Feedback-System/
├── apps/
│   ├── dashboard/                    # Next.js 15
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── (auth)/login/
│   │   │   └── (protected)/
│   │   │       ├── dashboard/
│   │   │       ├── feedback/[id]/
│   │   │       ├── clusters/
│   │   │       ├── reports/
│   │   │       └── settings/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── styles/
│   └── backend/                      # Express.js
│       └── src/
│           ├── config/
│           ├── middleware/
│           ├── routes/
│           ├── services/
│           └── utils/
├── packages/
│   └── shared/                       # Shared types + schemas
│       └── src/
│           ├── types/
│           ├── schemas/
│           └── constants/
└── docs/
    └── schema.sql                    # Supabase schema
```

---

## Pilot WhatsApp Web Strategy & Abstraction Layer

To accelerate testing and pilot deployment, the system temporarily integrates `whatsapp-web.js` instead of the Meta WhatsApp Cloud API.

### Abstraction Design (Migration Readiness)

To prevent coupling business logic to this temporary transport client, the architecture uses a strict messaging abstraction layer:

1. **`MessagingService` Interface** (`apps/backend/src/services/messaging/types.ts`): Declares platform-agnostic methods for starting connection listeners, sending messages, and registering incoming event callbacks.
2. **`WhatsAppWebService` Transport** (`apps/backend/src/services/messaging/whatsapp.ts`): Implements `MessagingService` using `whatsapp-web.js` with `LocalAuth` session persistence. Displays QR login codes directly in the terminal via `qrcode-terminal`.
3. **Decoupled Bot Service** (`apps/backend/src/services/bot/feedbackBot.ts`): Executes all menu flows, student verification checks, and feedback recording. It interacts exclusively with the generic `MessagingService` interface, remaining completely independent of the underlying library.

To migrate to the official Meta WhatsApp Cloud API in the future, developers only need to create a `MetaCloudMessagingService` implementing the `MessagingService` interface and swap the initialization export. No bot logic, AI triggers, or DB writes need to change.

### Conversation State Machine (In-Memory)

The bot runs a state machine to track active conversation stages (`idle`, `parent_menu`, `unregistered_menu`, `parent_student_selection`, `feedback_privacy`, `awaiting_admission_no`, `awaiting_feedback_text`, `awaiting_evidence`, `awaiting_tracking_no`) in-memory:
- **Parent-First Verification**: Check if the sender's WhatsApp phone number exists in `student_contacts` (mapped to one or multiple students). If found, the user enters the Parent Flow immediately. If not found, they proceed to the unregistered menu choice (Student Verification Flow).
- **Student Fallback Verification**: If unregistered, they choose Student Feedback, enter their Admission Number, and the system verifies it against the `students` registry.
- **Multiple Child Selection & Scopes**: Parents can select a specific child, General School Feedback (`student_id = NULL`), or Multiple Children Feedback (`student_id = NULL` and scope `multiple_students`).
- **Submitter Role**: Automatically set based on the contact relationship (Father/Mother -> Parent, Guardian -> Guardian, Student -> Student).
- **Duplicate Protection**: Prevents double-submissions by caching a hash of each user's latest text. If the same description is submitted within 5 minutes, it is rejected.

### Administrative Collection Toggle

To allow administrative control, we introduced a settings persistence mechanism:
- **Table**: `public.system_settings` stores key-value configuration overrides (e.g., `feedback_collection_enabled` = `true`/`false`).
- **Dashboard**: Authorized administrators can toggle collection status on the Settings page.
- **Bot Enforcement**: The bot queries this setting before starting a submission flow and rejects feedback collection if the switch is disabled.

