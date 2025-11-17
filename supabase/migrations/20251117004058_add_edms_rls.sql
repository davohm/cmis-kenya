-- Migration: Add RLS Policies for Enterprise Document Management System
-- Created: 2025-11-17
-- Description: Implements Row Level Security policies for documents, document_versions,
--              document_access_logs, and document_tags tables

-- ================================================================
-- 1. RLS POLICIES FOR documents TABLE
-- ================================================================

-- Policy 1: Super Admin can view all documents
CREATE POLICY "super_admin_view_all_documents" ON documents
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

-- Policy 2: County Admin can view documents in their county
CREATE POLICY "county_admin_view_county_documents" ON documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('COUNTY_ADMIN', 'COUNTY_OFFICER')
      AND ur.tenant_id = documents.tenant_id
      AND ur.is_active = true
    )
  );

-- Policy 3: Cooperative Admin can view documents for their cooperative
CREATE POLICY "cooperative_admin_view_cooperative_documents" ON documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'COOPERATIVE_ADMIN'
      AND ur.tenant_id = documents.tenant_id
      AND ur.is_active = true
    )
    AND (
      documents.cooperative_id IN (
        SELECT c.id FROM cooperatives c
        WHERE c.id IN (
          SELECT cooperative_id FROM cooperative_members
          WHERE user_id = auth.uid()
        )
      )
      OR documents.cooperative_id IS NULL
    )
  );

-- Policy 4: Users can view documents they uploaded
CREATE POLICY "users_view_own_documents" ON documents
  FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Policy 5: Super Admin can insert documents
CREATE POLICY "super_admin_insert_documents" ON documents
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

-- Policy 6: County Admin can insert documents in their county
CREATE POLICY "county_admin_insert_documents" ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('COUNTY_ADMIN', 'COUNTY_OFFICER')
      AND ur.tenant_id = documents.tenant_id
      AND ur.is_active = true
    )
  );

-- Policy 7: Cooperative Admin can insert documents for their cooperative
CREATE POLICY "cooperative_admin_insert_documents" ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'COOPERATIVE_ADMIN'
      AND ur.tenant_id = documents.tenant_id
      AND ur.is_active = true
    )
    AND (
      documents.cooperative_id IN (
        SELECT c.id FROM cooperatives c
        WHERE c.id IN (
          SELECT cooperative_id FROM cooperative_members
          WHERE user_id = auth.uid()
        )
      )
      OR documents.cooperative_id IS NULL
    )
  );

-- Policy 8: Users can insert their own documents
CREATE POLICY "users_insert_own_documents" ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- Policy 9: Super Admin can update all documents
CREATE POLICY "super_admin_update_documents" ON documents
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

-- Policy 10: County Admin can update documents in their county
CREATE POLICY "county_admin_update_documents" ON documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('COUNTY_ADMIN', 'COUNTY_OFFICER')
      AND ur.tenant_id = documents.tenant_id
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('COUNTY_ADMIN', 'COUNTY_OFFICER')
      AND ur.tenant_id = documents.tenant_id
      AND ur.is_active = true
    )
  );

-- Policy 11: Users can update documents they uploaded
CREATE POLICY "users_update_own_documents" ON documents
  FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

-- Policy 12: Super Admin can delete documents (soft delete via status)
CREATE POLICY "super_admin_delete_documents" ON documents
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

-- ================================================================
-- 2. RLS POLICIES FOR document_versions TABLE
-- ================================================================

-- Policy 1: Super Admin can view all document versions
CREATE POLICY "super_admin_view_all_document_versions" ON document_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'SUPER_ADMIN'
      AND ur.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_versions.document_id
      AND (
        d.uploaded_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_roles ur2
          WHERE ur2.user_id = auth.uid()
          AND ur2.tenant_id = d.tenant_id
          AND ur2.role IN ('COUNTY_ADMIN', 'COUNTY_OFFICER')
          AND ur2.is_active = true
        )
      )
    )
  );

-- Policy 2: Users can view versions of documents they have access to
CREATE POLICY "users_view_accessible_document_versions" ON document_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_versions.document_id
      AND (
        d.uploaded_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = auth.uid()
          AND ur.tenant_id = d.tenant_id
          AND ur.is_active = true
        )
      )
    )
  );

-- Policy 3: Super Admin can insert document versions
CREATE POLICY "super_admin_insert_document_versions" ON document_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'SUPER_ADMIN'
      AND ur.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_versions.document_id
      AND d.uploaded_by = auth.uid()
    )
  );

-- ================================================================
-- 3. RLS POLICIES FOR document_access_logs TABLE
-- ================================================================

-- Policy 1: Super Admin can view all access logs
CREATE POLICY "super_admin_view_all_access_logs" ON document_access_logs
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

-- Policy 2: Users can view their own access logs
CREATE POLICY "users_view_own_access_logs" ON document_access_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 3: County Admin can view access logs for documents in their county
CREATE POLICY "county_admin_view_county_access_logs" ON document_access_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN user_roles ur ON ur.tenant_id = d.tenant_id
      WHERE d.id = document_access_logs.document_id
      AND ur.user_id = auth.uid()
      AND ur.role IN ('COUNTY_ADMIN', 'COUNTY_OFFICER')
      AND ur.is_active = true
    )
  );

-- Policy 4: System can insert access logs (all authenticated users)
CREATE POLICY "authenticated_insert_access_logs" ON document_access_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ================================================================
-- 4. RLS POLICIES FOR document_tags TABLE
-- ================================================================

-- Policy 1: All authenticated users can view tags
CREATE POLICY "authenticated_view_document_tags" ON document_tags
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Super Admin can insert tags
CREATE POLICY "super_admin_insert_document_tags" ON document_tags
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

-- Policy 3: Super Admin can update tags
CREATE POLICY "super_admin_update_document_tags" ON document_tags
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

-- Policy 4: Super Admin can delete tags
CREATE POLICY "super_admin_delete_document_tags" ON document_tags
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
-- END OF MIGRATION
-- ================================================================

