-- ================================================================
-- COMPREHENSIVE MIGRATION - ALL FIXES CONSOLIDATED
-- Created: 2025-10-09
-- Description: Fixes all migration errors in one file
-- ================================================================

-- ================================================================
-- PART 1: ENABLE EXTENSIONS (MUST BE FIRST)
-- ================================================================

-- Enable pg_trgm extension for trigram matching (needed for fuzzy search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable uuid extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- PART 2: CREATE UTILITY FUNCTIONS
-- ================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PART 3: OFFICIAL SEARCHES SERVICE TABLES
-- ================================================================

-- Search Requests Table
CREATE TABLE IF NOT EXISTS public.search_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    search_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cooperative_id UUID REFERENCES public.cooperatives(id) ON DELETE CASCADE,
    
    -- Requester information (for anonymous users or certificate purposes)
    requester_name VARCHAR(255),
    requester_id_number VARCHAR(50),
    requester_email VARCHAR(255),
    requester_phone VARCHAR(20),
    purpose TEXT,
    
    -- Certificate & Payment
    certificate_generated BOOLEAN DEFAULT FALSE,
    certificate_number VARCHAR(50) UNIQUE,
    certificate_url TEXT,
    payment_reference VARCHAR(100),
    payment_amount DECIMAL(10, 2) DEFAULT 500.00,
    payment_status VARCHAR(20) DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- Constraints
    CONSTRAINT search_requests_payment_status_check CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED'))
);

-- Create indexes for search_requests
CREATE INDEX IF NOT EXISTS idx_search_requests_user_id ON public.search_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_search_requests_cooperative_id ON public.search_requests(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_search_requests_search_number ON public.search_requests(search_number);
CREATE INDEX IF NOT EXISTS idx_search_requests_certificate_number ON public.search_requests(certificate_number);
CREATE INDEX IF NOT EXISTS idx_search_requests_created_at ON public.search_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_requests_payment_status ON public.search_requests(payment_status);

-- Function to generate search number (SRH-YYYY-XXXX format)
CREATE OR REPLACE FUNCTION generate_search_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_part TEXT;
    next_sequence INTEGER;
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(search_number FROM 10) AS INTEGER)), 0) + 1
    INTO next_sequence
    FROM public.search_requests
    WHERE search_number LIKE 'SRH-' || year_part || '-%';
    
    sequence_part := LPAD(next_sequence::TEXT, 4, '0');
    
    RETURN 'SRH-' || year_part || '-' || sequence_part;
END;
$$ LANGUAGE plpgsql;

-- Function to generate certificate number (CERT-YYYY-XXXX format)
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_part TEXT;
    next_sequence INTEGER;
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(certificate_number FROM 11) AS INTEGER)), 0) + 1
    INTO next_sequence
    FROM public.search_requests
    WHERE certificate_number LIKE 'CERT-' || year_part || '-%';
    
    sequence_part := LPAD(next_sequence::TEXT, 4, '0');
    
    RETURN 'CERT-' || year_part || '-' || sequence_part;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate search_number
CREATE OR REPLACE FUNCTION set_search_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.search_number IS NULL OR NEW.search_number = '' THEN
        NEW.search_number := generate_search_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_search_number ON public.search_requests;
CREATE TRIGGER trigger_set_search_number
    BEFORE INSERT ON public.search_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_search_number();

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS trigger_search_requests_updated_at ON public.search_requests;
CREATE TRIGGER trigger_search_requests_updated_at
    BEFORE UPDATE ON public.search_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.search_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for search_requests
DROP POLICY IF EXISTS "Anyone can create search requests" ON public.search_requests;
CREATE POLICY "Anyone can create search requests"
    ON public.search_requests FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own search requests" ON public.search_requests;
CREATE POLICY "Users can view own search requests"
    ON public.search_requests FOR SELECT
    USING (
        auth.uid() = user_id
        OR auth.uid() IN (
            SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'COUNTY_ADMIN')
        )
    );

DROP POLICY IF EXISTS "Admins can view all search requests" ON public.search_requests;
CREATE POLICY "Admins can view all search requests"
    ON public.search_requests FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'COUNTY_ADMIN')
        )
    );

DROP POLICY IF EXISTS "Users can update own search requests" ON public.search_requests;
CREATE POLICY "Users can update own search requests"
    ON public.search_requests FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update all search requests" ON public.search_requests;
CREATE POLICY "Admins can update all search requests"
    ON public.search_requests FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'COUNTY_ADMIN')
        )
    );

-- Grant permissions
GRANT ALL ON public.search_requests TO authenticated;
GRANT SELECT ON public.search_requests TO anon;
GRANT INSERT ON public.search_requests TO anon;

-- ================================================================
-- PART 4: STORAGE BUCKET (FIXED - REMOVED ALTER TABLE)
-- ================================================================

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('registration-documents', 'registration-documents', false)
ON CONFLICT (id) DO NOTHING;

-- NOTE: storage.objects already has RLS enabled by default in Supabase
-- We only need to create the policies

-- Policy 1: Allow citizens to upload their own documents
DROP POLICY IF EXISTS "Citizens can upload their own registration documents" ON storage.objects;
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
DROP POLICY IF EXISTS "Citizens can read their own registration documents" ON storage.objects;
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
DROP POLICY IF EXISTS "Citizens can update their own registration documents" ON storage.objects;
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
DROP POLICY IF EXISTS "Citizens can delete their own registration documents" ON storage.objects;
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
DROP POLICY IF EXISTS "County officers can read all registration documents in their county" ON storage.objects;
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
DROP POLICY IF EXISTS "Super admins can read all registration documents" ON storage.objects;
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

-- ================================================================
-- PART 5: INTEGRATION AUDIT TRAIL TABLES (FIXED - ADDED IF NOT EXISTS)
-- ================================================================

-- IPRS Verifications Audit Trail
CREATE TABLE IF NOT EXISTS iprs_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_number VARCHAR(8) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Transactions (eCitizen)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_reference VARCHAR(100) NOT NULL UNIQUE,
  receipt_number VARCHAR(100),
  service_type VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) CHECK (payment_method IN ('MPESA', 'CARD')),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  payer_name VARCHAR(255) NOT NULL,
  payer_phone VARCHAR(20),
  payer_email VARCHAR(255),
  mpesa_number VARCHAR(20),
  card_last_four VARCHAR(4),
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- KRA Verifications Audit Trail
CREATE TABLE IF NOT EXISTS kra_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pin_number VARCHAR(11) NOT NULL,
  compliance_status VARCHAR(50) NOT NULL CHECK (compliance_status IN ('COMPLIANT', 'NON_COMPLIANT', 'PENDING')),
  certificate_number VARCHAR(100),
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SASRA Verifications Audit Trail
CREATE TABLE IF NOT EXISTS sasra_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cooperative_id UUID REFERENCES cooperatives(id) ON DELETE CASCADE,
  license_number VARCHAR(100),
  status VARCHAR(50) NOT NULL CHECK (status IN ('LICENSED', 'SUSPENDED', 'EXPIRED', 'NOT_LICENSED')),
  expiry_date DATE,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance (FIXED - ADDED IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_iprs_verifications_id_number ON iprs_verifications(id_number);
CREATE INDEX IF NOT EXISTS idx_iprs_verifications_verified_at ON iprs_verifications(verified_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_bill_ref ON payment_transactions(bill_reference);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kra_verifications_pin ON kra_verifications(pin_number);
CREATE INDEX IF NOT EXISTS idx_kra_verifications_verified_at ON kra_verifications(verified_at DESC);
CREATE INDEX IF NOT EXISTS idx_sasra_verifications_coop_id ON sasra_verifications(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_sasra_verifications_verified_at ON sasra_verifications(verified_at DESC);

-- ================================================================
-- PART 6: SEARCH INDEXES (FIXED - pg_trgm ALREADY ENABLED AT TOP)
-- ================================================================

-- Cooperatives search indexes
CREATE INDEX IF NOT EXISTS idx_cooperatives_name_search ON public.cooperatives USING gin (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_cooperatives_registration_number ON public.cooperatives (registration_number);
CREATE INDEX IF NOT EXISTS idx_cooperatives_name_trgm ON public.cooperatives USING gin (name gin_trgm_ops);

-- Registration applications search indexes
CREATE INDEX IF NOT EXISTS idx_applications_proposed_name_search ON public.registration_applications USING gin (to_tsvector('english', proposed_name));
CREATE INDEX IF NOT EXISTS idx_applications_application_number ON public.registration_applications (application_number);
CREATE INDEX IF NOT EXISTS idx_applications_proposed_name_trgm ON public.registration_applications USING gin (proposed_name gin_trgm_ops);

-- Users search indexes
CREATE INDEX IF NOT EXISTS idx_users_full_name_search ON public.users USING gin (to_tsvector('english', full_name));
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users (phone);
CREATE INDEX IF NOT EXISTS idx_users_id_number ON public.users (id_number);
CREATE INDEX IF NOT EXISTS idx_users_full_name_trgm ON public.users USING gin (full_name gin_trgm_ops);

-- Inquiry requests (complaints) search indexes
CREATE INDEX IF NOT EXISTS idx_inquiry_requests_number ON public.inquiry_requests (inquiry_number);
CREATE INDEX IF NOT EXISTS idx_inquiry_requests_subject_search ON public.inquiry_requests USING gin (to_tsvector('english', subject));
CREATE INDEX IF NOT EXISTS idx_inquiry_requests_subject_trgm ON public.inquiry_requests USING gin (subject gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_inquiry_requests_complaint_category ON public.inquiry_requests (complaint_category) WHERE complaint_category IS NOT NULL;

-- Amendment requests search indexes
CREATE INDEX IF NOT EXISTS idx_amendment_requests_number ON public.amendment_requests (request_number);
CREATE INDEX IF NOT EXISTS idx_amendment_requests_cooperative_id ON public.amendment_requests (cooperative_id);
CREATE INDEX IF NOT EXISTS idx_amendment_requests_amendment_type ON public.amendment_requests (amendment_type);

-- Auditor profiles search indexes
CREATE INDEX IF NOT EXISTS idx_auditor_profiles_full_name_search ON public.auditor_profiles USING gin (to_tsvector('english', full_name));
CREATE INDEX IF NOT EXISTS idx_auditor_profiles_full_name_trgm ON public.auditor_profiles USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_auditor_profiles_certification_body_trgm ON public.auditor_profiles USING gin (certification_body gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_auditor_profiles_is_active ON public.auditor_profiles (is_active);

-- Auditor applications search indexes
CREATE INDEX IF NOT EXISTS idx_auditor_applications_full_name_search ON public.auditor_applications USING gin (to_tsvector('english', full_name));
CREATE INDEX IF NOT EXISTS idx_auditor_applications_email ON public.auditor_applications (email);
CREATE INDEX IF NOT EXISTS idx_auditor_applications_certificate_number ON public.auditor_applications (certificate_number);

-- Trainer profiles search indexes
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_full_name_search ON public.trainer_profiles USING gin (to_tsvector('english', full_name));
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_full_name_trgm ON public.trainer_profiles USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_institution_trgm ON public.trainer_profiles USING gin (institution gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_is_active ON public.trainer_profiles (is_active);

-- Trainer applications search indexes
CREATE INDEX IF NOT EXISTS idx_trainer_applications_full_name_search ON public.trainer_applications USING gin (to_tsvector('english', full_name));
CREATE INDEX IF NOT EXISTS idx_trainer_applications_email ON public.trainer_applications (email);

-- Search requests (official searches) search indexes
CREATE INDEX IF NOT EXISTS idx_search_requests_requester_name_search ON public.search_requests USING gin (to_tsvector('english', requester_name));
CREATE INDEX IF NOT EXISTS idx_search_requests_requester_name_trgm ON public.search_requests USING gin (requester_name gin_trgm_ops);

-- Composite indexes for common query patterns

-- Cooperatives by tenant (county-based filtering)
CREATE INDEX IF NOT EXISTS idx_cooperatives_tenant_status ON public.cooperatives (tenant_id, status);

-- Applications by tenant (county-based filtering)
CREATE INDEX IF NOT EXISTS idx_applications_tenant_status ON public.registration_applications (tenant_id, status);

-- Users by tenant
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users (tenant_id);

-- Complaints by cooperative
CREATE INDEX IF NOT EXISTS idx_inquiry_requests_cooperative_status ON public.inquiry_requests (cooperative_id, complaint_status) WHERE complaint_category IS NOT NULL;

-- Amendments by cooperative
CREATE INDEX IF NOT EXISTS idx_amendment_requests_cooperative_status ON public.amendment_requests (cooperative_id, status);

-- ================================================================
-- COMMENTS
-- ================================================================

COMMENT ON TABLE public.search_requests IS 'Tracks official searches for cooperatives and certificate requests';
COMMENT ON COLUMN public.search_requests.search_number IS 'Auto-generated unique search reference number (SRH-YYYY-XXXX)';
COMMENT ON COLUMN public.search_requests.certificate_number IS 'Unique certificate number when certificate is generated (CERT-YYYY-XXXX)';
COMMENT ON COLUMN public.search_requests.payment_reference IS 'eCitizen or payment gateway transaction reference';

COMMENT ON INDEX idx_cooperatives_name_search IS 'Full-text search index for cooperative names using English dictionary';
COMMENT ON INDEX idx_cooperatives_name_trgm IS 'Trigram index for fuzzy matching on cooperative names';
COMMENT ON INDEX idx_users_full_name_search IS 'Full-text search index for user full names';
COMMENT ON INDEX idx_applications_proposed_name_search IS 'Full-text search index for application proposed names';

-- ================================================================
-- END OF COMPREHENSIVE MIGRATION
-- ================================================================
