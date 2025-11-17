/*
  # Auditor Registration Service (Service 12)
  
  This migration adds support for auditor registration and certification.
  Auditors can apply for certification to conduct cooperative audits.
*/

-- ============================================================================
-- AUDITOR REGISTRATION SERVICE
-- ============================================================================

-- Qualification levels for auditors
CREATE TYPE auditor_qualification AS ENUM (
  'CERTIFIED_PUBLIC_ACCOUNTANT',
  'CHARTERED_ACCOUNTANT',
  'COOPERATIVE_AUDITOR',
  'OTHER'
);

-- Application status for auditor registration
CREATE TYPE auditor_application_status AS ENUM (
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED'
);

-- Auditor specialization areas
CREATE TYPE auditor_specialization AS ENUM (
  'SACCO',
  'AGRICULTURAL',
  'TRANSPORT',
  'HOUSING',
  'CONSUMER',
  'MARKETING',
  'DAIRY',
  'SAVINGS',
  'MULTIPURPOSE'
);

-- Auditor Applications Table
CREATE TABLE IF NOT EXISTS auditor_applications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_number text UNIQUE NOT NULL,
  
  -- Applicant Information
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  id_number text NOT NULL,
  
  -- Professional Qualification
  qualification auditor_qualification NOT NULL,
  certification_body text NOT NULL,
  certificate_number text NOT NULL,
  certificate_issue_date date NOT NULL,
  years_experience integer NOT NULL,
  
  -- Specializations (array of specializations)
  specializations auditor_specialization[] NOT NULL,
  
  -- Document URLs
  professional_certificate_url text NOT NULL,
  academic_certificates_url text NOT NULL,
  practicing_certificate_url text NOT NULL,
  id_copy_url text NOT NULL,
  cv_url text NOT NULL,
  
  -- Application Status
  status auditor_application_status DEFAULT 'PENDING',
  submitted_at timestamptz DEFAULT now(),
  
  -- Admin Review
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  review_notes text,
  verification_notes text,
  
  -- Approval/Rejection
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  rejection_reason text,
  
  -- Terms acceptance
  terms_accepted boolean DEFAULT false,
  terms_accepted_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auditor Profiles Table (for approved auditors)
CREATE TABLE IF NOT EXISTS auditor_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  application_id uuid REFERENCES auditor_applications(id),
  
  -- Profile Information
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  photo_url text,
  
  -- Professional Details
  qualification auditor_qualification NOT NULL,
  certification_body text NOT NULL,
  certificate_number text NOT NULL,
  years_experience integer NOT NULL,
  specializations auditor_specialization[] NOT NULL,
  
  -- Performance Metrics
  total_audits_completed integer DEFAULT 0,
  cooperatives_audited integer DEFAULT 0,
  average_rating decimal(3,2) DEFAULT 0,
  
  -- Status
  is_active boolean DEFAULT true,
  certification_expiry_date date,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_auditor_applications_user_id ON auditor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_auditor_applications_status ON auditor_applications(status);
CREATE INDEX IF NOT EXISTS idx_auditor_applications_submitted_at ON auditor_applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_auditor_profiles_user_id ON auditor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_auditor_profiles_is_active ON auditor_profiles(is_active);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE auditor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditor_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own auditor applications"
  ON auditor_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own applications
CREATE POLICY "Users can create auditor applications"
  ON auditor_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all auditor applications"
  ON auditor_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('SUPER_ADMIN', 'COUNTY_ADMIN')
    )
  );

-- Admins can update applications (review, approve, reject)
CREATE POLICY "Admins can update auditor applications"
  ON auditor_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('SUPER_ADMIN', 'COUNTY_ADMIN')
    )
  );

-- Public can view approved auditor profiles
CREATE POLICY "Public can view approved auditor profiles"
  ON auditor_profiles FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can manage auditor profiles
CREATE POLICY "Admins can manage auditor profiles"
  ON auditor_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('SUPER_ADMIN', 'COUNTY_ADMIN')
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_auditor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auditor_applications_updated_at
  BEFORE UPDATE ON auditor_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_auditor_updated_at();

CREATE TRIGGER auditor_profiles_updated_at
  BEFORE UPDATE ON auditor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_auditor_updated_at();
