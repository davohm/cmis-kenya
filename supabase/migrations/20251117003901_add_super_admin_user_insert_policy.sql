-- Migration: Add Super Admin INSERT Policy for Users
-- Created: 2025-11-17
-- Description: Enables Super Admin to create users directly in the system
--              This complements the existing user creation through County Management

-- ================================================================
-- RLS POLICIES FOR users TABLE
-- ================================================================

-- Ensure RLS is enabled (should already be enabled, but safe to run)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Super Admin can insert users
CREATE POLICY "super_admin_insert_users" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'SUPER_ADMIN'
      AND ur.is_active = true
    )
  );

-- Note: This policy allows Super Admin to create users directly.
-- When creating a user, the Super Admin should also:
-- 1. Create the auth user via Supabase Auth (signUp)
-- 2. Insert into users table with the auth user's ID
-- 3. Create appropriate user_roles entries
--
-- The existing useCreateUser hook in useCountyManagement.ts handles this flow,
-- but this policy enables Super Admin to create users from any interface.

-- ================================================================
-- END OF MIGRATION
-- ================================================================

