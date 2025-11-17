-- Migration: Add RLS Policies for County Management Security
-- Created: 2025-10-09
-- Description: Implements strict Row Level Security policies for user_roles, tenants, and users tables
--              to prevent unauthorized role assignments and ensure proper access control

-- ================================================================
-- 1. RLS POLICIES FOR user_roles TABLE
-- ================================================================

-- Enable RLS on user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Super Admins can view all roles
CREATE POLICY "super_admin_view_all_roles" ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'SUPER_ADMIN'
      AND ur.is_active = true
    )
  );

-- Policy 2: Users can view their own roles
CREATE POLICY "users_view_own_roles" ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 3: Only Super Admins can insert new roles
CREATE POLICY "super_admin_insert_roles" ON user_roles
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

-- Policy 4: Only Super Admins can update roles
CREATE POLICY "super_admin_update_roles" ON user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'SUPER_ADMIN'
      AND ur.is_active = true
    )
  );

-- Policy 5: Only Super Admins can delete roles
CREATE POLICY "super_admin_delete_roles" ON user_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'SUPER_ADMIN'
      AND ur.is_active = true
    )
  );

-- ================================================================
-- 2. RLS POLICIES FOR tenants TABLE
-- ================================================================

-- Enable RLS on tenants table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Policy 1: All authenticated users can view tenants (for dropdowns)
CREATE POLICY "authenticated_view_tenants" ON tenants
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Only Super Admins can insert tenants
CREATE POLICY "super_admin_insert_tenants" ON tenants
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

-- Policy 3: Only Super Admins can update tenants
CREATE POLICY "super_admin_update_tenants" ON tenants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'SUPER_ADMIN'
      AND ur.is_active = true
    )
  );

-- ================================================================
-- 3. RLS POLICIES FOR users TABLE
-- ================================================================

-- Enable RLS on users table (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Super Admins can view all users
CREATE POLICY "super_admin_view_all_users" ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'SUPER_ADMIN'
      AND ur.is_active = true
    )
  );

-- Policy 2: Users can view their own profile
CREATE POLICY "users_view_own_profile" ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy 3: County Admins can view users in their county
CREATE POLICY "county_admin_view_county_users" ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'COUNTY_ADMIN'
      AND ur.tenant_id = users.tenant_id
      AND ur.is_active = true
    )
  );

-- Policy 4: Only Super Admins can update user tenant assignments
CREATE POLICY "super_admin_update_users" ON users
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'SUPER_ADMIN'
      AND ur.is_active = true
    )
  );

-- ================================================================
-- END OF MIGRATION
-- ================================================================
