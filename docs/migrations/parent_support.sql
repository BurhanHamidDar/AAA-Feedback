-- ============================================================
-- AAA Feedback — Parent & Guardian Support Migration
-- Decouples student verification from feedback submitter role
-- ============================================================

-- 1. Add parent/guardian fields to students table
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS parent_name TEXT,
  ADD COLUMN IF NOT EXISTS parent_phone TEXT,
  ADD COLUMN IF NOT EXISTS guardian_name TEXT,
  ADD COLUMN IF NOT EXISTS guardian_phone TEXT;

COMMENT ON COLUMN public.students.parent_name IS 'Name of the student''s parent (father/mother).';
COMMENT ON COLUMN public.students.parent_phone IS 'Contact phone number of the student''s parent.';
COMMENT ON COLUMN public.students.guardian_name IS 'Name of the student''s guardian (if applicable).';
COMMENT ON COLUMN public.students.guardian_phone IS 'Contact phone number of the student''s guardian.';

-- 2. Add submitter_type to feedback table with validation check constraint
ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS submitter_type TEXT NOT NULL DEFAULT 'Unknown';

-- Add check constraint for allowed submitter types
ALTER TABLE public.feedback
  DROP CONSTRAINT IF EXISTS feedback_submitter_type_check;

ALTER TABLE public.feedback
  ADD CONSTRAINT feedback_submitter_type_check
  CHECK (submitter_type IN ('Student', 'Parent', 'Guardian', 'Unknown'));

COMMENT ON COLUMN public.feedback.submitter_type IS 'Role of the submitter relative to the student record (Student, Parent, Guardian, Unknown).';
