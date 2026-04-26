DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'module_visibility_scope') THEN
    CREATE TYPE public.module_visibility_scope AS ENUM ('internal', 'external', 'both');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'form_review_status') THEN
    CREATE TYPE public.form_review_status AS ENUM ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'changes_requested');
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS integration_request text,
  ADD COLUMN IF NOT EXISTS intake_completed boolean NOT NULL DEFAULT false;

ALTER TABLE public.onboarding_modules
  ADD COLUMN IF NOT EXISTS visibility_scope public.module_visibility_scope NOT NULL DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS released_roles public.app_role[] NOT NULL DEFAULT '{}'::public.app_role[],
  ADD COLUMN IF NOT EXISTS public_summary text,
  ADD COLUMN IF NOT EXISTS public_teaser_updated_at timestamp with time zone;

UPDATE public.onboarding_modules
SET public_summary = COALESCE(public_summary, summary),
    released_roles = CASE WHEN cardinality(released_roles) = 0 THEN audience_roles ELSE released_roles END,
    public_teaser_updated_at = COALESCE(public_teaser_updated_at, now());

ALTER TABLE public.onboarding_forms
  ADD COLUMN IF NOT EXISTS review_status public.form_review_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS review_notes text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS submitted_by_role public.app_role;

CREATE OR REPLACE FUNCTION public.sync_module_public_teaser()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.public_summary IS NULL OR NEW.public_summary = '' OR NEW.summary IS DISTINCT FROM OLD.summary OR NEW.title IS DISTINCT FROM OLD.title THEN
    NEW.public_summary := left(NEW.summary, 220);
    NEW.public_teaser_updated_at := now();
  END IF;
  IF cardinality(NEW.released_roles) = 0 THEN
    NEW.released_roles := NEW.audience_roles;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_module_public_teaser_trigger ON public.onboarding_modules;
CREATE TRIGGER sync_module_public_teaser_trigger
BEFORE INSERT OR UPDATE ON public.onboarding_modules
FOR EACH ROW
EXECUTE FUNCTION public.sync_module_public_teaser();

CREATE OR REPLACE FUNCTION public.mark_assignment_overdue()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status <> 'signed'::public.assignment_status AND NEW.due_at IS NOT NULL AND NEW.due_at < now() THEN
    NEW.status := 'overdue'::public.assignment_status;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mark_assignment_overdue_trigger ON public.onboarding_assignments;
CREATE TRIGGER mark_assignment_overdue_trigger
BEFORE INSERT OR UPDATE ON public.onboarding_assignments
FOR EACH ROW
EXECUTE FUNCTION public.mark_assignment_overdue();

CREATE OR REPLACE FUNCTION public.refresh_overdue_assignments()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  changed_count integer;
BEGIN
  UPDATE public.onboarding_assignments
  SET status = 'overdue'::public.assignment_status,
      updated_at = now()
  WHERE status <> 'signed'::public.assignment_status
    AND due_at IS NOT NULL
    AND due_at < now();
  GET DIAGNOSTICS changed_count = ROW_COUNT;
  RETURN changed_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_form_for_review()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.review_status = 'submitted'::public.form_review_status AND OLD.review_status IS DISTINCT FROM NEW.review_status THEN
    NEW.submitted_at := COALESCE(NEW.submitted_at, now());
    NEW.status := 'in_progress'::public.assignment_status;
  END IF;
  IF NEW.review_status IN ('approved', 'rejected', 'changes_requested') AND OLD.review_status IS DISTINCT FROM NEW.review_status THEN
    NEW.reviewed_at := now();
    NEW.status := CASE WHEN NEW.review_status = 'approved' THEN 'signed'::public.assignment_status ELSE 'in_progress'::public.assignment_status END;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS submit_form_for_review_trigger ON public.onboarding_forms;
CREATE TRIGGER submit_form_for_review_trigger
BEFORE UPDATE ON public.onboarding_forms
FOR EACH ROW
EXECUTE FUNCTION public.submit_form_for_review();

DROP POLICY IF EXISTS "Role members can view assigned modules" ON public.onboarding_modules;
CREATE POLICY "Role members can view released modules"
ON public.onboarding_modules
FOR SELECT
TO authenticated
USING (
  status = 'active'::public.onboarding_status
  AND (
    public.is_management_or_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = ANY (onboarding_modules.released_roles)
    )
  )
);

DROP POLICY IF EXISTS "Published module teasers are visible" ON public.onboarding_modules;
CREATE POLICY "Published short module teasers are visible"
ON public.onboarding_modules
FOR SELECT
TO anon, authenticated
USING (status = 'active'::public.onboarding_status AND is_public_teaser = true);

CREATE INDEX IF NOT EXISTS idx_onboarding_modules_released_roles ON public.onboarding_modules USING GIN (released_roles);
CREATE INDEX IF NOT EXISTS idx_onboarding_assignments_due_status ON public.onboarding_assignments (due_at, status);
CREATE INDEX IF NOT EXISTS idx_onboarding_forms_review_status ON public.onboarding_forms (review_status);
CREATE INDEX IF NOT EXISTS idx_profiles_intake_completed ON public.profiles (intake_completed);
