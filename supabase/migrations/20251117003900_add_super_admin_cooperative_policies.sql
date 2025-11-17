-- Migration: Add Super Admin INSERT/UPDATE/DELETE Policies for Cooperatives
-- Created: 2025-11-17
-- Description: Enables Super Admin to create, update, and delete cooperatives
--              while maintaining existing permissions for other roles

-- ================================================================
-- RLS POLICIES FOR cooperatives TABLE
-- ================================================================

-- Ensure RLS is enabled (should already be enabled, but safe to run)
ALTER TABLE cooperatives ENABLE ROW LEVEL SECURITY;

-- Policy 1: Super Admin can insert cooperatives
CREATE POLICY "super_admin_insert_cooperatives" ON cooperatives
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

-- Policy 2: Super Admin can update cooperatives
CREATE POLICY "super_admin_update_cooperatives" ON cooperatives
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'SUPER_ADMIN'
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'SUPER_ADMIN'
      AND ur.is_active = true
    )
  );

-- Policy 3: Super Admin can delete cooperatives (soft delete via is_active)
-- Note: We use UPDATE to set is_active = false rather than actual DELETE
-- This preserves data integrity and allows for recovery if needed
-- Actual DELETE should be restricted to prevent data loss

-- Policy 4: County Admin can insert cooperatives in their county
CREATE POLICY "county_admin_insert_cooperatives" ON cooperatives
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('COUNTY_ADMIN', 'COUNTY_OFFICER')
      AND ur.tenant_id = cooperatives.tenant_id
      AND ur.is_active = true
    )
  );

-- Policy 5: County Admin can update cooperatives in their county
CREATE POLICY "county_admin_update_cooperatives" ON cooperatives
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('COUNTY_ADMIN', 'COUNTY_OFFICER')
      AND ur.tenant_id = cooperatives.tenant_id
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('COUNTY_ADMIN', 'COUNTY_OFFICER')
      AND ur.tenant_id = cooperatives.tenant_id
      AND ur.is_active = true
    )
  );

-- ================================================================
-- END OF MIGRATION
-- ================================================================

