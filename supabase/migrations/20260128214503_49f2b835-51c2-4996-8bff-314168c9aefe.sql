-- A secure, RLS-safe check used by the client to decide whether to show First Time Setup
CREATE OR REPLACE FUNCTION public.is_system_initialized()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'master_admin'
  )
$$;

-- Allow unauthenticated clients to call it (returns only a boolean)
GRANT EXECUTE ON FUNCTION public.is_system_initialized() TO anon, authenticated;