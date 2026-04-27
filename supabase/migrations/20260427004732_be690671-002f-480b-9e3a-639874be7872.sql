-- Ensure stable uniqueness for profile upserts and module management
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique ON public.profiles (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_role_unique ON public.user_roles (user_id, role);
CREATE UNIQUE INDEX IF NOT EXISTS onboarding_modules_slug_unique ON public.onboarding_modules (slug);
CREATE INDEX IF NOT EXISTS onboarding_assignments_due_status_idx ON public.onboarding_assignments (due_at, status);
CREATE INDEX IF NOT EXISTS legal_signatures_user_module_idx ON public.legal_signatures (user_id, module_id);

-- Allow management and admin to manage module release settings
DROP POLICY IF EXISTS "Admins manage modules" ON public.onboarding_modules;
CREATE POLICY "Admins and management manage modules"
ON public.onboarding_modules
FOR ALL
TO authenticated
USING (public.is_management_or_admin(auth.uid()))
WITH CHECK (public.is_management_or_admin(auth.uid()));

-- Keep public teaser and released role defaults synchronized
DROP TRIGGER IF EXISTS sync_module_public_teaser_trigger ON public.onboarding_modules;
CREATE TRIGGER sync_module_public_teaser_trigger
BEFORE INSERT OR UPDATE OF title, summary, public_summary, audience_roles, released_roles, is_public_teaser
ON public.onboarding_modules
FOR EACH ROW
EXECUTE FUNCTION public.sync_module_public_teaser();

-- Mark overdue assignments whenever due dates/status changes
DROP TRIGGER IF EXISTS mark_assignment_overdue_trigger ON public.onboarding_assignments;
CREATE TRIGGER mark_assignment_overdue_trigger
BEFORE INSERT OR UPDATE OF due_at, status
ON public.onboarding_assignments
FOR EACH ROW
EXECUTE FUNCTION public.mark_assignment_overdue();

-- Keep submitted/reviewed form states consistent
DROP TRIGGER IF EXISTS submit_form_for_review_trigger ON public.onboarding_forms;
CREATE TRIGGER submit_form_for_review_trigger
BEFORE UPDATE OF review_status
ON public.onboarding_forms
FOR EACH ROW
EXECUTE FUNCTION public.submit_form_for_review();

CREATE OR REPLACE FUNCTION public.apply_signature_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.module_id IS NOT NULL THEN
    UPDATE public.onboarding_assignments
    SET status = 'signed'::public.assignment_status,
        updated_at = now()
    WHERE assigned_to = NEW.user_id
      AND module_id = NEW.module_id;
  END IF;

  UPDATE public.profiles
  SET onboarding_status = CASE
        WHEN EXISTS (
          SELECT 1 FROM public.onboarding_assignments oa
          WHERE oa.assigned_to = NEW.user_id
            AND oa.status <> 'signed'::public.assignment_status
        ) THEN 'in_progress'::public.assignment_status
        ELSE 'signed'::public.assignment_status
      END,
      updated_at = now()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_signature_progress_trigger ON public.legal_signatures;
CREATE TRIGGER apply_signature_progress_trigger
AFTER INSERT ON public.legal_signatures
FOR EACH ROW
EXECUTE FUNCTION public.apply_signature_progress();