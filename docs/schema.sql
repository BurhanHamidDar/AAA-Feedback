-- ============================================================
-- AAA Feedback — Supabase PostgreSQL Schema
-- Ayesha Ali Academy Feedback Management System
-- Developer: Burhan Hamid
-- Version: 0.1.0
--
-- HOW TO RUN:
-- 1. Go to your Supabase project → SQL Editor
-- 2. Paste this entire file and run it
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search

-- ============================================================
-- ADMINS
-- Extends Supabase auth.users — only registered admins can log in
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admins (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'admin'
                          CHECK (role IN ('principal', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.admins IS 'Admin profiles for the AAA Feedback dashboard. Linked to Supabase auth.users.';
COMMENT ON COLUMN public.admins.role IS 'principal = full access. admin = standard access (no identity for principal_only feedback).';

-- ============================================================
-- STUDENTS
-- School-provided student registry for verification
-- ============================================================

CREATE TABLE IF NOT EXISTS public.students (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_no  TEXT        NOT NULL UNIQUE,
  student_name  TEXT        NOT NULL,
  class         TEXT        NOT NULL,
  section       TEXT        NOT NULL,
  parent_name   TEXT,
  parent_phone  TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.students IS 'Student registry for Ayesha Ali Academy verification.';

CREATE INDEX IF NOT EXISTS idx_students_admission_no ON public.students (admission_no);

-- ============================================================
-- STUDENT CONTACTS
-- Multi-contact support linking parents/guardians to students (Redesign)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.student_contacts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  contact_name  TEXT        NOT NULL,
  relationship  TEXT        NOT NULL CHECK (relationship IN ('Father', 'Mother', 'Guardian', 'Other')),
  phone_number  TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_student_contact UNIQUE (student_id, phone_number, relationship)
);

COMMENT ON TABLE public.student_contacts IS 'Multi-contact directory linking parent/guardian phone numbers to students.';

CREATE INDEX IF NOT EXISTS idx_student_contacts_phone_number ON public.student_contacts (phone_number);
CREATE INDEX IF NOT EXISTS idx_student_contacts_student_id ON public.student_contacts (student_id);

-- ============================================================
-- WHATSAPP SESSIONS
-- Tracks verified student identity linked to WhatsApp phone numbers
-- ============================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
  whatsapp_number   TEXT        PRIMARY KEY,
  student_id        UUID        REFERENCES public.students(id) ON DELETE CASCADE,
  verified_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  failed_attempts   INTEGER     NOT NULL DEFAULT 0,
  last_failed_at    TIMESTAMPTZ,
  blocked_until     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.whatsapp_sessions IS 'Tracks verified student sessions linked to WhatsApp numbers.';

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_student_id ON public.whatsapp_sessions (student_id);

-- ============================================================
-- ISSUE CLUSTERS
-- Defined before feedback because feedback references it
-- ============================================================

CREATE TABLE IF NOT EXISTS public.issue_clusters (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT,
  category      TEXT        CHECK (category IN (
                              'Academics', 'Transport', 'Infrastructure',
                              'Staff', 'Discipline', 'Administration',
                              'Facilities', 'Safety', 'General', 'Other'
                            )),
  report_count  INTEGER     NOT NULL DEFAULT 1,
  status        TEXT        NOT NULL DEFAULT 'open'
                            CHECK (status IN ('open', 'resolved')),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.issue_clusters IS 'Grouped recurring issues detected through duplicate detection (Phase 6).';

-- ============================================================
-- FEEDBACK
-- Core table — every submission ends up here
-- ============================================================

CREATE TABLE IF NOT EXISTS public.feedback (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_type       TEXT        NOT NULL
                                    CHECK (submission_type IN ('anonymous', 'principal_only', 'contact_me')),
  submitter_type        TEXT        NOT NULL DEFAULT 'Unknown'
                                    CHECK (submitter_type IN ('Student', 'Parent', 'Guardian', 'Unknown')),

  -- The original submission text
  raw_text              TEXT        NOT NULL,

  -- AI-generated fields (NULL while pending processing)
  summary               TEXT,
  category              TEXT        CHECK (category IN (
                                      'Academics', 'Transport', 'Infrastructure',
                                      'Staff', 'Discipline', 'Administration',
                                      'Facilities', 'Safety', 'General', 'Other'
                                    )),
  sentiment             TEXT        CHECK (sentiment IN ('Positive', 'Neutral', 'Negative', 'Mixed')),
  priority              TEXT        CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  ai_processed          BOOLEAN     NOT NULL DEFAULT FALSE,
  ai_processed_at       TIMESTAMPTZ,  -- NULL = pending; set when AI processing completes

  -- Submitter identity
  -- For anonymous: both NULL (never stored)
  -- For principal_only / contact_me: stored here
  submitter_name        TEXT,
  submitter_phone       TEXT,

  -- Lifecycle
  status                TEXT        NOT NULL DEFAULT 'new'
                                    CHECK (status IN ('new', 'under_review', 'resolved', 'closed')),

  -- Duplicate detection
  cluster_id            UUID        REFERENCES public.issue_clusters(id) ON DELETE SET NULL,

  -- For deduplication of WhatsApp messages
  whatsapp_message_id   TEXT        UNIQUE,

  -- Verification details (Admission Number Validation System)
  student_id            UUID        REFERENCES public.students(id) ON DELETE SET NULL,
  feedback_scope        TEXT        NOT NULL DEFAULT 'student_specific'
                                    CHECK (feedback_scope IN ('student_specific', 'multiple_students', 'general_school')),
  submitter_relationship TEXT,
  is_anonymous          BOOLEAN     NOT NULL DEFAULT FALSE,
  verification_status   TEXT        NOT NULL DEFAULT 'pending',
  verified_at           TIMESTAMPTZ,
  resolved_at           TIMESTAMPTZ,

  -- Tracking & status info (Phase 9)
  tracking_number       TEXT        UNIQUE,
  last_action_note      TEXT,
  status_updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.feedback IS 'Core feedback table. Each row is one submission.';
COMMENT ON COLUMN public.feedback.ai_processed_at IS 'NULL = pending AI processing. Set to NOW() when AI analysis completes.';
COMMENT ON COLUMN public.feedback.submitter_phone IS 'NULL for anonymous submissions. Never stored for anonymous type.';
COMMENT ON COLUMN public.feedback.resolved_at IS 'Timestamp when the feedback was resolved. Automatically set by trigger.';

-- Full-text search index on raw_text
CREATE INDEX IF NOT EXISTS idx_feedback_raw_text_trgm
  ON public.feedback USING gin (raw_text gin_trgm_ops);

-- Filtering indexes
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback (status);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON public.feedback (category);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON public.feedback (priority);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON public.feedback (sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_submission_type ON public.feedback (submission_type);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_cluster_id ON public.feedback (cluster_id);
CREATE INDEX IF NOT EXISTS idx_feedback_student_id ON public.feedback (student_id);
CREATE INDEX IF NOT EXISTS idx_feedback_feedback_scope ON public.feedback (feedback_scope);
CREATE INDEX IF NOT EXISTS idx_feedback_resolved_at ON public.feedback (resolved_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_tracking_number ON public.feedback (tracking_number);


-- Trigger: update updated_at automatically
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Feedback Tracking Number Sequence & Trigger (Phase 9) ──
CREATE SEQUENCE IF NOT EXISTS public.feedback_tracking_no_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.generate_tracking_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_val BIGINT;
  current_year INT;
BEGIN
  IF NEW.tracking_number IS NULL THEN
    seq_val := nextval('public.feedback_tracking_no_seq');
    current_year := EXTRACT(YEAR FROM NOW());
    NEW.tracking_number := 'FB-' || current_year || '-' || lpad(seq_val::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS feedback_tracking_number_trigger ON public.feedback;
CREATE TRIGGER feedback_tracking_number_trigger
  BEFORE INSERT ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.generate_tracking_number();

-- ── Feedback Lifecycle Triggers (Phase 9) ──
-- Trigger function for BEFORE INSERT OR UPDATE on feedback (handles status_updated_at & resolved_at)
CREATE OR REPLACE FUNCTION public.feedback_lifecycle_before()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    NEW.status_updated_at = NOW();
    
    IF NEW.status = 'resolved' THEN
      NEW.resolved_at = NOW();
    ELSE
      NEW.resolved_at = NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS feedback_lifecycle_before_trigger ON public.feedback;
CREATE TRIGGER feedback_lifecycle_before_trigger
  BEFORE INSERT OR UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.feedback_lifecycle_before();

-- Trigger function for AFTER INSERT OR UPDATE on feedback (handles timeline table writes)
CREATE OR REPLACE FUNCTION public.feedback_lifecycle_after()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.feedback_timeline (feedback_id, status, action_note, created_at)
    VALUES (NEW.id, NEW.status, 'Feedback submitted.', NEW.created_at);
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.feedback_timeline (feedback_id, status, action_note, created_at)
      VALUES (
        NEW.id,
        NEW.status,
        COALESCE(NEW.last_action_note, 'Status changed to ' || NEW.status || '.'),
        NOW()
      );
    ELSIF OLD.last_action_note IS DISTINCT FROM NEW.last_action_note AND NEW.last_action_note IS NOT NULL THEN
      INSERT INTO public.feedback_timeline (feedback_id, status, action_note, created_at)
      VALUES (
        NEW.id,
        NEW.status,
        NEW.last_action_note,
        NOW()
      );
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS feedback_lifecycle_after_trigger ON public.feedback;
CREATE TRIGGER feedback_lifecycle_after_trigger
  AFTER INSERT OR UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.feedback_lifecycle_after();

CREATE TRIGGER feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER whatsapp_sessions_updated_at
  BEFORE UPDATE ON public.whatsapp_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- FEEDBACK EVIDENCE
-- Images / screenshots attached to a feedback submission
-- ============================================================

CREATE TABLE IF NOT EXISTS public.feedback_evidence (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id  UUID        NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  file_url     TEXT        NOT NULL,   -- Cloudflare R2 public URL
  file_type    TEXT        NOT NULL DEFAULT 'image'
                           CHECK (file_type IN ('image', 'document')),
  file_size    INTEGER,                -- bytes
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.feedback_evidence IS 'Evidence files (images, screenshots) attached to feedback. Stored in Cloudflare R2; only URLs here.';

CREATE INDEX IF NOT EXISTS idx_evidence_feedback_id ON public.feedback_evidence (feedback_id);

-- ============================================================
-- FEEDBACK COMMENTS
-- Notes added by Principal / Admin during review
-- ============================================================

CREATE TABLE IF NOT EXISTS public.feedback_comments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id   UUID        NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  admin_id      UUID        NOT NULL REFERENCES public.admins(id) ON DELETE RESTRICT,
  comment_text  TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.feedback_comments IS 'Internal notes added by admins/principal on feedback items.';

CREATE INDEX IF NOT EXISTS idx_comments_feedback_id ON public.feedback_comments (feedback_id);
CREATE INDEX IF NOT EXISTS idx_comments_admin_id ON public.feedback_comments (admin_id);

-- ============================================================
-- FEEDBACK TIMELINE (Phase 9)
-- Chronological audit updates visible to administrators and users
-- ============================================================

CREATE TABLE IF NOT EXISTS public.feedback_timeline (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id  UUID        NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL,
  action_note  TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_timeline_feedback_id ON public.feedback_timeline (feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_timeline_created_at ON public.feedback_timeline (created_at DESC);

ALTER TABLE public.feedback_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "timeline_authenticated_all" ON public.feedback_timeline
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- AUDIT LOGS
-- Append-only compliance trail for all significant actions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID        REFERENCES public.admins(id) ON DELETE SET NULL,
  action       TEXT        NOT NULL,  -- 'status_change', 'comment_added', 'login', etc.
  entity_type  TEXT        CHECK (entity_type IN ('feedback', 'cluster', 'admin')),
  entity_id    UUID,
  old_value    JSONB,
  new_value    JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.audit_logs IS 'Append-only audit trail. Never delete rows from this table.';

CREATE INDEX IF NOT EXISTS idx_audit_admin_id ON public.audit_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_logs (created_at DESC);

-- ============================================================
-- REPORTS
-- Cached monthly report snapshots
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reports (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_month         DATE        NOT NULL UNIQUE,  -- YYYY-MM-01
  total_feedback       INTEGER     NOT NULL DEFAULT 0,
  category_breakdown   JSONB       NOT NULL DEFAULT '[]',
  sentiment_breakdown  JSONB       NOT NULL DEFAULT '[]',
  top_issues           JSONB       NOT NULL DEFAULT '[]',
  generated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.reports IS 'Cached monthly analytics reports. Regenerated on demand.';

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
  ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.feedback_evidence ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.feedback_comments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.issue_clusters ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
  
  -- ── Students & Sessions ──────────────────────────────────────
  CREATE POLICY "students_authenticated_all" ON public.students
    FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));
  
  CREATE POLICY "sessions_authenticated_all" ON public.whatsapp_sessions
    FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

-- ── Admins ──────────────────────────────────────────────────
-- Admins can only see their own profile
CREATE POLICY "admins_own_profile" ON public.admins
  FOR SELECT USING (auth.uid() = id);

-- ── Feedback ─────────────────────────────────────────────────
-- Only registered admins can read/update/delete feedback
CREATE POLICY "feedback_authenticated_read" ON public.feedback
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

CREATE POLICY "feedback_authenticated_update" ON public.feedback
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

CREATE POLICY "feedback_authenticated_delete" ON public.feedback
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

-- ── Evidence ─────────────────────────────────────────────────
CREATE POLICY "evidence_authenticated_read" ON public.feedback_evidence
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

CREATE POLICY "evidence_authenticated_insert" ON public.feedback_evidence
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

-- ── Comments ─────────────────────────────────────────────────
CREATE POLICY "comments_authenticated_read" ON public.feedback_comments
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

CREATE POLICY "comments_authenticated_insert" ON public.feedback_comments
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

-- ── Clusters ─────────────────────────────────────────────────
CREATE POLICY "clusters_authenticated_read" ON public.issue_clusters
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

CREATE POLICY "clusters_authenticated_all" ON public.issue_clusters
  FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

-- ── Audit Logs ───────────────────────────────────────────────
-- Insert for all admins, select only for principal role
CREATE POLICY "audit_authenticated_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

-- Note: SELECT on audit_logs is enforced at API layer by checking admin.role = 'principal'

-- ── Reports ──────────────────────────────────────────────────
CREATE POLICY "reports_authenticated_read" ON public.reports
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

CREATE POLICY "reports_authenticated_all" ON public.reports
  FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

-- ============================================================
-- SYSTEM SETTINGS
-- Global system configuration options
-- ============================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  key         TEXT        PRIMARY KEY,
  value       JSONB       NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.system_settings IS 'Global system configurations for the AAA Feedback portal.';

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_authenticated_all" ON public.system_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

-- Seed settings
INSERT INTO public.system_settings (key, value)
VALUES ('feedback_collection_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- SEED DATA — Initial Admin Account
-- Run this AFTER creating the user in Supabase Auth dashboard
-- Replace the UUID with the actual user ID from auth.users
-- ============================================================

-- Example (replace UUID and name with real values):
-- INSERT INTO public.admins (id, name, role)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'Principal Name', 'principal')
-- ON CONFLICT (id) DO NOTHING;
