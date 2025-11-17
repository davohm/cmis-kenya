-- ================================================================
-- MIGRATION: Fix RLS Infinite Recursion
-- Created: 2025-10-09
-- Description: Fixes infinite recursion in user_roles RLS policies
-- ================================================================

-- PROBLEM: The user_roles policies were checking user_roles to verify 
-- if user is SUPER_ADMIN, creating infinite recursion

-- SOLUTION: Use a SECURITY DEFINER function and simpler policies

-- ================================================================
-- Step 1: Drop problematic recursive policies
-- ================================================================

DROP POLICY IF EXISTS "super_admin_view_all_roles" ON user_roles;
DROP POLICY IF EXISTS "super_admin_insert_roles" ON user_roles;
DROP POLICY IF EXISTS "super_admin_update_roles" ON user_roles;
DROP POLICY IF EXISTS "super_admin_delete_roles" ON user_roles;
DROP POLICY IF EXISTS "users_view_own_roles" ON user_roles;

-- ================================================================
-- Step 2: Create SECURITY DEFINER function to check admin status
-- ================================================================

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'SUPER_ADMIN'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_super_admin() IS 'Checks if current user is a super admin without triggering RLS recursion';

-- ================================================================
-- Step 3: Create non-recursive policies
-- ================================================================

-- Policy 1: All authenticated users can view user_roles
-- This is necessary for the app to check user permissions
CREATE POLICY "authenticated_users_can_view_roles" ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Users can view their own roles (explicit but safe)
CREATE POLICY "users_view_own_roles" ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 3: Only super admins can insert roles
CREATE POLICY "super_admin_insert_roles" ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

-- Policy 4: Only super admins can update roles
CREATE POLICY "super_admin_update_roles" ON user_roles
  FOR UPDATE
  TO authenticated
  USING (is_super_admin());

-- Policy 5: Only super admins can delete roles
CREATE POLICY "super_admin_delete_roles" ON user_roles
  FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- ================================================================
-- Step 4: Refresh schema cache (force PostgREST to reload)
-- ================================================================

NOTIFY pgrst, 'reload schema';

-- ================================================================
-- END OF MIGRATION
-- ================================================================

/*
TESTING:
1. Log in as any user - should be able to load profile (view user_roles)
2. Log in as SUPER_ADMIN - should be able to manage roles
3. Log in as regular user - should NOT be able to insert/update/delete roles
4. No infinite recursion errors should appear
*/
