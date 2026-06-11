-- ============================================================
-- AAA Feedback — Phase 9 Database Migration
-- Adds Feedback Tracking & Status Inquiry System
-- ============================================================

-- 1. Add new columns to public.feedback
ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS tracking_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS last_action_note TEXT,
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_tracking_number ON public.feedback (tracking_number);

-- 2. Create public.feedback_timeline table
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

DROP POLICY IF EXISTS "timeline_authenticated_all" ON public.feedback_timeline;
CREATE POLICY "timeline_authenticated_all" ON public.feedback_timeline
  FOR ALL USING (auth.role() = 'authenticated');

-- 3. Create tracking number sequence
CREATE SEQUENCE IF NOT EXISTS public.feedback_tracking_no_seq START WITH 1;

-- 4. Create trigger function to generate sequential tracking numbers
CREATE OR REPLACE FUNCTION public.generate_tracking_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_val BIGINT;
  current_year INT;
BEGIN
  IF NEW.tracking_number IS NULL THEN
    seq_val := nextval('public.feedback_tracking_no_seq');
    current_year := EXTRACT(YEAR FROM NOW());
    NEW.tracking_number := 'AAA-' || current_year || '-' || lpad(seq_val::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS feedback_tracking_number_trigger ON public.feedback;
CREATE TRIGGER feedback_tracking_number_trigger
  BEFORE INSERT ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.generate_tracking_number();

-- 5. Create trigger function for BEFORE INSERT OR UPDATE on feedback (status_updated_at & resolved_at)
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

-- 6. Create trigger function for AFTER INSERT OR UPDATE on feedback (timeline table writes)
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
