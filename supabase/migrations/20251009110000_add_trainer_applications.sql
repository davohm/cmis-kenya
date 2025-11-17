/*
  # Trainer Registration Service (Service 10)
  
  This migration adds support for trainer registration and certification.
  Trainers can apply for approval to conduct cooperative training programs.
*/

-- ============================================================================
-- TRAINER REGISTRATION SERVICE
-- ============================================================================

-- Education levels for trainers
CREATE TYPE education_level AS ENUM (
  'DIPLOMA',
  'DEGREE',
  'MASTERS',
  'PHD'
);

-- Training specialization areas
CREATE TYPE trainer_specialization AS ENUM (
  'GOVERNANCE',
  'FINANCIAL_MANAGEMENT',
  'BOOKKEEPING',
  'LEADERSHIP',
  'COMPLIANCE',
  'DIGITAL_LITERACY',
  'ENTREPRENEURSHIP',
  'OTHER'
);

-- Languages of instruction
CREATE TYPE instruction_language AS ENUM (
  'ENGLISH',
  'SWAHILI',
  'OTHER'
);

-- Application status for trainer registration
CREATE TYPE trainer_application_status AS ENUM (
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED'
);

-- Trainer Applications Table
CREATE TABLE IF NOT EXISTS trainer_applications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_number text UNIQUE NOT NULL,
  
  -- Applicant Information
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  id_number text NOT NULL,
  
  -- Education and Professional Qualification
  education_level education_level NOT NULL,
  institution text NOT NULL,
  years_experience integer NOT NULL,
  
  -- Training Specializations (array of specializations)
  specializations trainer_specialization[] NOT NULL,
  
  -- Languages of Instruction
  languages instruction_language[] NOT NULL,
  
  -- Document URLs
  academic_certificates_url text NOT NULL,
  training_certificates_url text NOT NULL,
  sample_materials_url text NOT NULL,
  id_copy_url text NOT NULL,
  cv_url text NOT NULL,
  
  -- Application Status
  status trainer_application_status DEFAULT 'PENDING',
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

-- Trainer Profiles Table (for approved trainers)
CREATE TABLE IF NOT EXISTS trainer_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  application_id uuid REFERENCES trainer_applications(id),
  
  -- Profile Information
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  photo_url text,
  
  -- Professional Details
  education_level education_level NOT NULL,
  institution text NOT NULL,
  years_experience integer NOT NULL,
  specializations trainer_specialization[] NOT NULL,
  languages instruction_language[] NOT NULL,
  
  -- Performance Metrics (linked to training_programs table)
  total_programs_delivered integer DEFAULT 0,
  total_participants_trained integer DEFAULT 0,
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

CREATE INDEX IF NOT EXISTS idx_trainer_applications_user_id ON trainer_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_trainer_applications_status ON trainer_applications(status);
CREATE INDEX IF NOT EXISTS idx_trainer_applications_submitted_at ON trainer_applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_user_id ON trainer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_is_active ON trainer_profiles(is_active);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE trainer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own trainer applications"
  ON trainer_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own applications
CREATE POLICY "Users can create trainer applications"
  ON trainer_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all trainer applications"
  ON trainer_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('SUPER_ADMIN', 'COUNTY_ADMIN')
    )
  );

-- Admins can update applications (review, approve, reject)
CREATE POLICY "Admins can update trainer applications"
  ON trainer_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('SUPER_ADMIN', 'COUNTY_ADMIN')
    )
  );

-- Public can view approved trainer profiles
CREATE POLICY "Public can view approved trainer profiles"
  ON trainer_profiles FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can manage trainer profiles
CREATE POLICY "Admins can manage trainer profiles"
  ON trainer_profiles FOR ALL
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
CREATE OR REPLACE FUNCTION update_trainer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trainer_applications_updated_at
  BEFORE UPDATE ON trainer_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_trainer_updated_at();

CREATE TRIGGER trainer_profiles_updated_at
  BEFORE UPDATE ON trainer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_trainer_updated_at();
