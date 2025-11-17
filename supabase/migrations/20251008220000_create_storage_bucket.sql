-- Create Storage Bucket for Registration Documents

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('registration-documents', 'registration-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow citizens to upload their own documents (based on application_id in path)
CREATE POLICY "Citizens can upload their own registration documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'registration-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM registration_applications WHERE applicant_user_id = auth.uid()
  )
);

-- Policy 2: Allow citizens to read their own documents
CREATE POLICY "Citizens can read their own registration documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'registration-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM registration_applications WHERE applicant_user_id = auth.uid()
  )
);

-- Policy 3: Allow citizens to update their own documents
CREATE POLICY "Citizens can update their own registration documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'registration-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM registration_applications WHERE applicant_user_id = auth.uid()
  )
);

-- Policy 4: Allow citizens to delete their own documents
CREATE POLICY "Citizens can delete their own registration documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'registration-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM registration_applications WHERE applicant_user_id = auth.uid()
  )
);

-- Policy 5: Allow county officers and admins to read all documents in their tenant
CREATE POLICY "County officers can read all registration documents in their county"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'registration-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT ra.id::text 
    FROM registration_applications ra
    JOIN users u ON u.id = auth.uid()
    WHERE ra.tenant_id = u.tenant_id
    AND u.id IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('COUNTY_ADMIN', 'COUNTY_OFFICER', 'SUPER_ADMIN')
      AND is_active = true
    )
  )
);

-- Policy 6: Allow super admins to read all documents
CREATE POLICY "Super admins can read all registration documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'registration-documents' AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'SUPER_ADMIN' 
    AND is_active = true
  )
);
