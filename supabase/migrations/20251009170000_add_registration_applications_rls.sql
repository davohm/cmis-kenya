-- Migration: Add RLS Policies for Registration Applications
-- Created: 2025-10-09
-- Description: Implements Row Level Security policies for registration_applications table
--              to allow users to create and manage draft applications

-- ================================================================
-- RLS POLICIES FOR registration_applications TABLE
-- ================================================================

-- Policy 1: Users can view their own applications
CREATE POLICY "users_view_own_applications" ON registration_applications
  FOR SELECT
  TO authenticated
  USING (applicant_user_id = auth.uid());

-- Policy 2: Super Admins can view all applications
CREATE POLICY "super_admin_view_all_applications" ON registration_applications
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

-- Policy 3: County Admins can view applications in their county
CREATE POLICY "county_admin_view_county_applications" ON registration_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('COUNTY_ADMIN', 'COUNTY_OFFICER')
      AND ur.tenant_id = registration_applications.tenant_id
      AND ur.is_active = true
    )
  );

-- Policy 4: Authenticated users can insert their own applications (for draft creation)
CREATE POLICY "users_insert_own_applications" ON registration_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (applicant_user_id = auth.uid());

-- Policy 5: Users can update their own draft applications
CREATE POLICY "users_update_own_drafts" ON registration_applications
  FOR UPDATE
  TO authenticated
  USING (
    applicant_user_id = auth.uid() 
    AND status IN ('DRAFT', 'SUBMITTED')
  )
  WITH CHECK (
    applicant_user_id = auth.uid()
  );

-- Policy 6: County Admins can update applications in their county (for status changes)
CREATE POLICY "county_admin_update_county_applications" ON registration_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('COUNTY_ADMIN', 'COUNTY_OFFICER')
      AND ur.tenant_id = registration_applications.tenant_id
      AND ur.is_active = true
    )
  );

-- Policy 7: Super Admins can update any application
CREATE POLICY "super_admin_update_all_applications" ON registration_applications
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

-- Policy 8: Users can delete their own draft applications
CREATE POLICY "users_delete_own_drafts" ON registration_applications
  FOR DELETE
  TO authenticated
  USING (
    applicant_user_id = auth.uid() 
    AND status = 'DRAFT'
  );

-- ================================================================
-- END OF MIGRATION
-- ================================================================
