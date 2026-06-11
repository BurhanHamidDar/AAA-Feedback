# AAA Feedback — Ayesha Ali Academy Feedback Management System

> **Developed by Burhan Hamid**  
> Institution: Ayesha Ali Academy

---

## What Is This?

AAA Feedback is a production-grade, single-institution feedback management platform built exclusively for Ayesha Ali Academy. It enables students and parents to submit feedback through a WhatsApp bot and provides the Principal with a centralized AI-assisted dashboard to review, prioritize, and act on feedback efficiently.

## Key Features

- **WhatsApp Bot** — Students/parents submit feedback via WhatsApp (no app download required)
- **AI Processing** — Every submission is automatically summarized, categorized, sentiment-analyzed, and prioritized
- **Principal Dashboard** — A clean, modern interface to review all feedback
- **Duplicate Detection** — Recurring issues are automatically clustered (e.g., 50 reports about bus delays → 1 "Transport Delay" cluster)
- **Status Tracking** — Full workflow from New → Under Review → Resolved → Closed
- **Evidence Support** — Images and screenshots can be attached to feedback
- **Analytics & Reports** — Monthly PDF/Excel reports, trend charts, category breakdowns

## Who Uses This?

| Role | Access |
|------|--------|
| Principal | Full dashboard access, sees all feedback including identity for non-anonymous types |
| Admin | Dashboard access, sees feedback summaries (no identity for Principal Only type) |
| Students | Submit feedback via WhatsApp only |
| Parents | Submit feedback via WhatsApp only |

## Architecture Overview

```
Students/Parents → WhatsApp Bot → Meta Cloud API
                                        ↓
                                   Backend API (Express.js)
                                        ↓
                              Supabase PostgreSQL Database
                                        ↓
                                   OpenRouter AI
                                        ↓
                             Principal Dashboard (Next.js)
```

## Repository Structure

```
AAA-Feedback-System/
├── apps/
│   ├── dashboard/          # Next.js 15 frontend (Vercel)
│   └── backend/            # Express.js API (Oracle Cloud / Render)
├── packages/
│   └── shared/             # Shared TypeScript types + Zod schemas
├── docs/
│   └── schema.sql          # Supabase database schema
└── [documentation files]
```

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+

### Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/dashboard/.env.example apps/dashboard/.env.local
cp apps/backend/.env.example apps/backend/.env

# Start development servers
pnpm dev
```

Dashboard: http://localhost:3000  
Backend API: http://localhost:4000

## Documentation

| File | Purpose |
|------|---------|
| [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) | Business context and requirements |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical architecture details |
| [TASKS.md](./TASKS.md) | Development roadmap and task tracking |
| [CHANGELOG.md](./CHANGELOG.md) | Version history and changes |
| [DECISIONS.md](./DECISIONS.md) | Technical decision log (ADRs) |

## AI Integration (Phase 3)

### AI Architecture & Models
The AI layer is structured as a dedicated modular service in `apps/backend/src/services/ai/analyzeFeedback.ts`.
- **Primary Model**: `qwen/qwen3:free`
- **Fallback Model**: `deepseek/deepseek-chat-v3:free`

### Fallback Strategy
1. **Primary execution**: Send feedback text to the primary model with a 15-second timeout.
2. **Fallback execution**: If the primary model fails or times out, automatically retry with the fallback model.
3. **Safe defaults**: If both models fail, use defaults to ensure that feedback submission never breaks:
   - Category: `General`
   - Sentiment: `Neutral`
   - Priority: `Medium`
   - Summary: `"AI summary unavailable."`

### Database Changes
The `feedback` table columns have been updated to use standardized, prefix-free names with capitalized enum constraints matching the academy's branding schema:
- `summary` (TEXT)
- `category` (TEXT CHECK Category IN ('Academics', 'Transport', 'Infrastructure', 'Staff', 'Discipline', 'Administration', 'Facilities', 'Safety', 'General', 'Other'))
- `sentiment` (TEXT CHECK Sentiment IN ('Positive', 'Neutral', 'Negative', 'Mixed'))
- `priority` (TEXT CHECK Priority IN ('Low', 'Medium', 'High', 'Critical'))
- `ai_processed` (BOOLEAN NOT NULL DEFAULT FALSE)
- `ai_processed_at` (TIMESTAMPTZ)

### API & Dashboard Enhancements
- **Asynchronous Processing**: Feedback submissions return success immediately. AI analysis is queued in the background and updates the database row when finished.
- **Public Submission**: Exposed `POST /api/feedback` for incoming feedback submissions.
- **Reprocessing**: Exposed `POST /api/feedback/:id/reprocess` to manually re-analyze feedback.
- **Multi-Filtering**: Modified the GET queries and the dashboard `FeedbackFilters` UI to support choosing multiple categories, priorities, and sentiments simultaneously using custom multi-select checkbox dropdown components.

## Parent-First Verification & Verification System (Redesign)

### Verification Flow
To prevent unauthorized submissions, every feedback submission is verified. The flow optimizes the parent experience:
1. **Parent-First Check**: The bot checks the sender's phone number against `student_contacts` (matching the last 10 digits).
2. **Auto-Identification**: If registered, the parent is immediately welcomed by name and proceeds to student/scope selection without typing an Admission Number.
3. **Student Fallback**: If unregistered, the user is offered a choice: Student Feedback (prompting for Admission Number lookup) or Help & Information.

### Multi-Contact & Scope Architecture
- **Multi-Contact Linkage**: The `student_contacts` table links multiple parent contacts to a single student (Father, Mother, Guardian, Other) and also allows a single parent's phone number to link to multiple children in the school.
- **Feedback Scopes**:
  - `student_specific`: Linked to a specific child (student ID stored).
  - `multiple_students`: Linked to multiple children of the parent (student ID NULL).
  - `general_school`: General school feedback e.g., transport, administration (student ID NULL).

### Rate Limiting & Security
- **Limits**: Maximum of 5 verification failures per day per WhatsApp number for Admission Number attempts.
- **Block Duration**: 24-hour block on subsequent verification requests if the limit is exceeded.
- **Audit Logs**: Every verification success/failure is logged to the `audit_logs` table.

### Anonymity & Data Preservation
- **Preserved References**: Identity details (names, phones, student IDs) are stored in the database for analytics, abuse prevention, and auditing.
- **API Masking**: The backend routes strictly strip all student details and parent details on API query responses for anonymous submissions, ensuring complete anonymity on the dashboard frontend.

### Dashboard & Analytics Enhancements
- **Detail Views**: Renders Submitter Type, Submitter Relationship, and Feedback Scope in detail panes. Masks all personal info if the feedback is anonymous.
- **Feedback Table**: Submitter cells format details dynamically, displaying student info + parent relationship for student feedback, or scope names (General School / Multiple Children) + parent relationship for student-agnostic feedback.
- **Analytics Distribution Charts**: Incorporates **Submitter Role**, **Feedback Scope**, and **Parent Relationship** distribution charts in the analytics panel.
- **Global Settings Toggle**: Administrators can globally toggle "Enable Feedback Collection". If disabled, the bot rejects new submissions while leaving tracking/help online.

---

*This system is exclusively for Ayesha Ali Academy. It does not support multi-school or SaaS features.*

