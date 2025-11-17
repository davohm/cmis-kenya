-- ================================================================
-- MIGRATION: Add get_user_profile RPC Function
-- Created: 2025-10-09
-- Description: Creates RPC function to fetch user profile with roles
--              This bypasses RLS policies for user authentication flow
-- ================================================================

-- Drop function if exists
DROP FUNCTION IF EXISTS get_user_profile(uuid);

-- Create the get_user_profile function
CREATE OR REPLACE FUNCTION get_user_profile(user_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  phone text,
  tenant_id uuid,
  tenant_name text,
  role user_role
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.phone,
    u.tenant_id,
    t.name as tenant_name,
    ur.role
  FROM users u
  LEFT JOIN tenants t ON u.tenant_id = t.id
  LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = true
  WHERE u.id = user_id
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_profile(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_user_profile(uuid) IS 'Fetches user profile with roles, bypassing RLS for authentication flow';

-- ================================================================
-- END OF MIGRATION
-- ================================================================
