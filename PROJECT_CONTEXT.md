# Project Context — AAA Feedback

## Institution

**Name:** Ayesha Ali Academy  
**Developer:** Burhan Hamid  
**Project Start:** June 2026

---

## Business Problem

Ayesha Ali Academy has 1400+ students. Parents and students have concerns, suggestions, and complaints — but there is no structured channel to capture them. Issues go unreported or are communicated informally and lost.

The Principal needs:
1. A way for anyone to submit feedback without friction
2. A system that organizes and prioritizes feedback automatically
3. A dashboard that surfaces what matters most, without reading hundreds of raw messages
4. A record of actions taken and resolutions

---

## Solution

A WhatsApp-first feedback system:
- **No app download** required for submitters
- **WhatsApp bot** guides users through structured submission
- **AI automatically** processes every submission (summary, category, sentiment, priority)
- **Dashboard** shows the Principal a clean, organized view
- **Duplicate detection** groups 50 identical complaints into 1 cluster

---

## User Personas

### Principal
- Reviews the dashboard daily or weekly
- Wants to see critical issues immediately
- Needs to add comments and track resolution
- Needs monthly reports for governance

### Admin Staff
- Supports the Principal
- Can view and comment on feedback
- Cannot see identity for "Principal Only" submissions

### Students & Parents / Guardians
- Verify legitimacy via student Admission Number
- Specify submitter role (Student, Parent, Guardian) on submission
- Submit feedback via WhatsApp (Anonymous / Principal Only / Contact Me)
- May attach image evidence

---

## Feedback Submission Types

| Type | Who Sees Identity |
|------|-------------------|
| Anonymous | Nobody — identity is never stored |
| Principal Only | Principal only (encrypted, admin-restricted) |
| Contact Me | Principal + eligible admins |

---

## Scope Constraints

This system is **exclusively** for Ayesha Ali Academy.

**NOT in scope:**
- Multi-school / multi-tenant
- SaaS / subscription billing
- Public-facing website
- Student grade management
- Staff management beyond admin roles

---

## Success Metrics

- 80%+ of feedback processed by AI within 30 seconds of submission
- Principal can review daily feedback in under 10 minutes
- Zero anonymous identity leaks
- Monthly report generation in under 60 seconds
- System uptime 99%+

---

## Constraints & Non-Negotiables

1. Anonymous feedback must be completely anonymous — no IP, no phone, no metadata linking to identity
2. "Principal Only" identity must only be visible to the Principal role
3. All AI processing must be non-blocking (async queue)
4. File uploads must go to Cloudflare R2 — only URLs stored in database
5. WhatsApp number is dedicated — no manual conversations on that number
6. Dashboard must work on mobile (Principal may review on phone)
7. Parent-First Verification Flow: All WhatsApp bot and API submissions query the student registry (the `students` table) by normalizing both the incoming sender number and the registered parent/guardian phone numbers using the `normalizePhoneNumber` helper. It removes characters like spaces, dashes, brackets, asterisks, and the leading plus. It fully supports Indian country codes (e.g. matching +91 98765-43210 with 9876543210). If matched, the user proceeds immediately to the Parent welcome flow without entering an admission number. Unregistered numbers go to the Student verification fallback flow.
8. Verification Security: Verification attempts are rate-limited to a maximum of 5 failures per day per phone number, applying a 24-hour block on subsequent requests if exceeded.
9. Anonymity Preservation: Anonymous feedback preserves complete referential integrity in the database (retaining student and contact keys) but strictly masks identifying details (name, phone, student, admission number) on backend API serialization before sending to the dashboard.
10. Analytics & Reporting: Reports and analytics compile statistics on Submitter Type (Student/Parent), Relationship (Father, Mother, Guardian), and Feedback Scope (Student Specific, Multiple Students, General School).
11. Pilot WhatsApp Integration: For pilot and demonstration phases, the system uses `whatsapp-web.js` session authentication, abstracting the messaging layer to ensure seamless future migration to the Meta WhatsApp Cloud API.
12. Multi-Contact & Scope Architecture: Supports One Student -> Many Contacts, and One Contact -> Many Students. It allows feedback scoped to a single student, multiple students, or general school-wide issues (where student_id is null).
13. Global Settings Control: Administrators can globally toggle the "Enable Feedback Collection" setting. If disabled, new feedback submissions are blocked (displaying a customizable bot response), while tracking and help inquiries remain operational.




