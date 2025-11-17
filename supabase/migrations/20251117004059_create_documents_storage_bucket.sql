-- Migration: Create Documents Storage Bucket
-- Created: 2025-11-17
-- Description: Creates the documents storage bucket with RLS policies

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (if not already enabled)
-- Note: RLS is typically enabled by default in Supabase

-- Policy 1: Super Admin can upload documents
CREATE POLICY "super_admin_upload_documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'SUPER_ADMIN'
    AND ur.is_active = true
  )
);

-- Policy 2: County Admin can upload documents in their county folder
CREATE POLICY "county_admin_upload_documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('COUNTY_ADMIN', 'COUNTY_OFFICER')
    AND ur.is_active = true
    AND (storage.foldername(name))[1] = ur.tenant_id::text
  )
);

-- Policy 3: Users can upload their own documents
CREATE POLICY "users_upload_own_documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[3] = auth.uid()::text
);

-- Policy 4: Super Admin can read all documents
CREATE POLICY "super_admin_read_documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'SUPER_ADMIN'
    AND ur.is_active = true
  )
);

-- Policy 5: County Admin can read documents in their county
CREATE POLICY "county_admin_read_documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('COUNTY_ADMIN', 'COUNTY_OFFICER')
    AND ur.is_active = true
    AND (storage.foldername(name))[1] = ur.tenant_id::text
  )
);

-- Policy 6: Users can read documents they uploaded
CREATE POLICY "users_read_own_documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[3] = auth.uid()::text
);

-- Policy 7: Super Admin can update all documents
CREATE POLICY "super_admin_update_documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'SUPER_ADMIN'
    AND ur.is_active = true
  )
);

-- Policy 8: Users can update documents they uploaded
CREATE POLICY "users_update_own_documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[3] = auth.uid()::text
);

-- Policy 9: Super Admin can delete documents
CREATE POLICY "super_admin_delete_documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'SUPER_ADMIN'
    AND ur.is_active = true
  )
);

-- Policy 10: Users can delete documents they uploaded
CREATE POLICY "users_delete_own_documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[3] = auth.uid()::text
);

