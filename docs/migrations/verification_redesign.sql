-- ============================================================
-- AAA Feedback — Database Schema Migration
-- Verification Redesign & Parent-First Bot Flow
-- ============================================================

-- 1. Create student_contacts table
CREATE TABLE IF NOT EXISTS public.student_contacts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  contact_name  TEXT        NOT NULL,
  relationship  TEXT        NOT NULL CHECK (relationship IN ('Father', 'Mother', 'Guardian', 'Other')),
  phone_number  TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_student_contact UNIQUE (student_id, phone_number, relationship)
);

-- Indexing for search performance
CREATE INDEX IF NOT EXISTS idx_student_contacts_phone_number ON public.student_contacts (phone_number);
CREATE INDEX IF NOT EXISTS idx_student_contacts_student_id ON public.student_contacts (student_id);

-- Enable RLS
ALTER TABLE public.student_contacts ENABLE ROW LEVEL SECURITY;

-- Hardened RLS Policy (Access restricted to registered admins only)
DROP POLICY IF EXISTS "contacts_authenticated_all" ON public.student_contacts;
CREATE POLICY "contacts_authenticated_all" ON public.student_contacts
  FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

-- 2. Migrate existing parent data from public.students to public.student_contacts
-- Migrate parent details (defaulting relationship to 'Father'/'Mother' if present)
INSERT INTO public.student_contacts (student_id, contact_name, relationship, phone_number)
SELECT id, parent_name, 'Father', parent_phone
FROM public.students
WHERE parent_name IS NOT NULL AND parent_phone IS NOT NULL AND TRIM(parent_phone) <> ''
ON CONFLICT DO NOTHING;

-- Migrate guardian details
INSERT INTO public.student_contacts (student_id, contact_name, relationship, phone_number)
SELECT id, guardian_name, 'Guardian', guardian_phone
FROM public.students
WHERE guardian_name IS NOT NULL AND guardian_phone IS NOT NULL AND TRIM(guardian_phone) <> ''
ON CONFLICT DO NOTHING;

-- 3. Add feedback_scope and submitter_relationship columns to public.feedback
ALTER TABLE public.feedback 
  ADD COLUMN IF NOT EXISTS feedback_scope TEXT NOT NULL DEFAULT 'student_specific'
  CHECK (feedback_scope IN ('student_specific', 'multiple_students', 'general_school')),
  ADD COLUMN IF NOT EXISTS submitter_relationship TEXT;

CREATE INDEX IF NOT EXISTS idx_feedback_feedback_scope ON public.feedback (feedback_scope);

-- 4. Update the tracking number trigger to use the FB- prefix
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

-- 5. Hardened RLS Policy Update for the new timeline policy
DROP POLICY IF EXISTS "settings_authenticated_all" ON public.system_settings;
CREATE POLICY "settings_authenticated_all" ON public.system_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));
