-- Create a secure function for first-time setup that bypasses RLS
-- This function only works when there are NO existing users in user_roles
CREATE OR REPLACE FUNCTION public.setup_first_admin(admin_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Check if any roles exist
    SELECT COUNT(*) INTO user_count FROM public.user_roles;
    
    -- Only allow if this is truly the first user
    IF user_count > 0 THEN
        RAISE EXCEPTION 'First admin already exists. Use normal role assignment.';
    END IF;
    
    -- Insert the master admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'master_admin');
    
    RETURN true;
END;
$$;

-- Grant execute permission to authenticated users (function self-validates)
GRANT EXECUTE ON FUNCTION public.setup_first_admin(uuid) TO authenticated;