/*
  # CMIS Multi-Tenant Database Schema - Initial Setup
  
  ## Overview
  This migration creates the foundational database schema for Kenya's Cooperative Management 
  Information System (CMIS), supporting national headquarters and all 47 counties.
  
  ## 1. Core Multi-Tenant Architecture
  
  ### Tables Created:
  - `tenants` - Represents counties and national HQ (48 total tenants)
  - `users` - System users linked to Supabase auth
  - `user_roles` - Role assignments for users within tenants
  
  ### Tenant Types:
  - NATIONAL_HQ: State Department for Cooperatives headquarters
  - COUNTY: Each of the 47 county offices
  
  ### User Roles:
  - SUPER_ADMIN: National HQ administrators with full system access
  - COUNTY_ADMIN: County-level administrators
  - COUNTY_OFFICER: County cooperative development officers
  - COOPERATIVE_ADMIN: Cooperative society representatives/managers
  - AUDITOR: Certified auditors
  - TRAINER: Training providers and educators
  - CITIZEN: General public users
  
  ## 2. Cooperative Management Tables
  
  ### Core Entities:
  - `cooperatives` - Registered cooperative societies
  - `cooperative_types` - Types of cooperatives (SACCO, Agricultural, Housing, etc.)
  - `cooperative_members` - Members of cooperative societies
  - `cooperative_officials` - Elected officials and management
  
  ## 3. Registration & Compliance Services (Services 1-6)
  
  ### Tables:
  - `registration_applications` - New cooperative registration requests
  - `amendment_requests` - Amendments to bylaws, name changes, etc.
  - `compliance_reports` - Annual compliance submissions
  - `audit_reports` - External audit reports
  - `disputes` - Dispute resolution cases
  - `liquidation_cases` - Cooperative liquidation proceedings
  
  ## 4. Financial Management (Services 7-10)
  
  ### Tables:
  - `financial_statements` - Annual financial statements
  - `loans_advances` - Loan applications and tracking
  - `revenue_payments` - Fee and levy payments
  - `grant_applications` - Government grant applications
  
  ## 5. Training & Development (Services 11-13)
  
  ### Tables:
  - `training_programs` - Training courses and programs
  - `training_registrations` - Participant registrations
  - `trainer_certifications` - Certified trainer records
  
  ## 6. Information & Research (Services 14-17)
  
  ### Tables:
  - `cooperative_statistics` - Statistical data collection
  - `research_publications` - Research papers and reports
  - `inquiry_requests` - Public information requests
  - `advisory_services` - Technical advisory services
  
  ## 7. Security Implementation
  
  - RLS enabled on all tables
  - Tenant isolation enforced at database level
  - Role-based access policies for each service
  - Audit logging for compliance
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE MULTI-TENANT ARCHITECTURE
-- ============================================================================

-- Tenant Types Enum
CREATE TYPE tenant_type AS ENUM ('NATIONAL_HQ', 'COUNTY');

-- User Roles Enum
CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN',
  'COUNTY_ADMIN', 
  'COUNTY_OFFICER',
  'COOPERATIVE_ADMIN',
  'AUDITOR',
  'TRAINER',
  'CITIZEN'
);

-- Tenants Table (Counties + National HQ)
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type tenant_type NOT NULL,
  county_code text,
  contact_email text,
  contact_phone text,
  address text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  id_number text UNIQUE,
  tenant_id uuid REFERENCES tenants(id),
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Roles Table (Users can have multiple roles across tenants)
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id),
  role user_role NOT NULL,
  assigned_by uuid REFERENCES users(id),
  assigned_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(user_id, tenant_id, role)
);

-- ============================================================================
-- COOPERATIVE MANAGEMENT
-- ============================================================================

-- Cooperative Types
CREATE TYPE cooperative_category AS ENUM (
  'SACCO',
  'AGRICULTURAL',
  'HOUSING',
  'TRANSPORT',
  'CONSUMER',
  'MARKETING',
  'DAIRY',
  'SAVINGS',
  'MULTIPURPOSE',
  'OTHER'
);

CREATE TABLE IF NOT EXISTS cooperative_types (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  category cooperative_category NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Cooperative Status
CREATE TYPE cooperative_status AS ENUM (
  'PENDING_REGISTRATION',
  'REGISTERED',
  'ACTIVE',
  'SUSPENDED',
  'UNDER_LIQUIDATION',
  'DISSOLVED',
  'INACTIVE'
);

-- Cooperatives Table
CREATE TABLE IF NOT EXISTS cooperatives (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_number text UNIQUE,
  name text NOT NULL,
  type_id uuid REFERENCES cooperative_types(id),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  status cooperative_status DEFAULT 'PENDING_REGISTRATION',
  registration_date date,
  address text,
  postal_address text,
  email text,
  phone text,
  total_members integer DEFAULT 0,
  total_share_capital decimal(15,2) DEFAULT 0,
  bylaws_document_url text,
  certificate_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cooperative Members
CREATE TABLE IF NOT EXISTS cooperative_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cooperative_id uuid REFERENCES cooperatives(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  member_number text NOT NULL,
  full_name text NOT NULL,
  id_number text NOT NULL,
  phone text,
  email text,
  address text,
  shares_owned integer DEFAULT 0,
  share_value decimal(15,2) DEFAULT 0,
  date_joined date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(cooperative_id, member_number)
);

-- Cooperative Officials
CREATE TYPE official_position AS ENUM (
  'CHAIRPERSON',
  'VICE_CHAIRPERSON',
  'SECRETARY',
  'TREASURER',
  'COMMITTEE_MEMBER',
  'MANAGER',
  'CEO',
  'OTHER'
);

CREATE TABLE IF NOT EXISTS cooperative_officials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cooperative_id uuid REFERENCES cooperatives(id) ON DELETE CASCADE,
  member_id uuid REFERENCES cooperative_members(id),
  position official_position NOT NULL,
  full_name text NOT NULL,
  id_number text NOT NULL,
  phone text,
  email text,
  appointment_date date NOT NULL,
  term_end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SERVICE 1: COOPERATIVE REGISTRATION
-- ============================================================================

CREATE TYPE application_status AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'ADDITIONAL_INFO_REQUIRED',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN'
);

CREATE TABLE IF NOT EXISTS registration_applications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_number text UNIQUE NOT NULL,
  proposed_name text NOT NULL,
  type_id uuid REFERENCES cooperative_types(id),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  applicant_user_id uuid REFERENCES users(id),
  
  -- Application Details
  proposed_members integer NOT NULL,
  proposed_share_capital decimal(15,2),
  primary_activity text,
  operating_area text,
  address text,
  contact_person text NOT NULL,
  contact_phone text NOT NULL,
  contact_email text,
  
  -- Documents
  bylaws_url text,
  member_list_url text,
  minutes_url text,
  id_copies_url text,
  
  -- Processing
  status application_status DEFAULT 'DRAFT',
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  review_notes text,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  rejection_reason text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SERVICE 2: AMENDMENTS & CHANGES
-- ============================================================================

CREATE TYPE amendment_type AS ENUM (
  'BYLAW_AMENDMENT',
  'NAME_CHANGE',
  'ADDRESS_CHANGE',
  'OFFICIAL_CHANGE',
  'MEMBERSHIP_RULES',
  'SHARE_CAPITAL_CHANGE',
  'OTHER'
);

CREATE TABLE IF NOT EXISTS amendment_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number text UNIQUE NOT NULL,
  cooperative_id uuid REFERENCES cooperatives(id) ON DELETE CASCADE,
  amendment_type amendment_type NOT NULL,
  
  -- Request Details
  current_value text,
  proposed_value text,
  reason text NOT NULL,
  supporting_documents_url text,
  resolution_minutes_url text,
  
  -- Processing
  status application_status DEFAULT 'DRAFT',
  submitted_by uuid REFERENCES users(id),
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  review_notes text,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  effective_date date,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SERVICE 3: COMPLIANCE MONITORING
-- ============================================================================

CREATE TYPE compliance_status AS ENUM (
  'COMPLIANT',
  'NON_COMPLIANT',
  'PENDING_REVIEW',
  'PARTIALLY_COMPLIANT',
  'OVERDUE'
);

CREATE TABLE IF NOT EXISTS compliance_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number text UNIQUE NOT NULL,
  cooperative_id uuid REFERENCES cooperatives(id) ON DELETE CASCADE,
  financial_year integer NOT NULL,
  
  -- Report Details
  agm_held boolean DEFAULT false,
  agm_date date,
  agm_minutes_url text,
  financial_statement_url text,
  audit_report_url text,
  annual_return_url text,
  
  -- Compliance Checks
  bylaws_compliant boolean DEFAULT false,
  meetings_compliant boolean DEFAULT false,
  records_compliant boolean DEFAULT false,
  financial_compliant boolean DEFAULT false,
  
  -- Review
  status compliance_status DEFAULT 'PENDING_REVIEW',
  submitted_by uuid REFERENCES users(id),
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  review_notes text,
  compliance_score integer,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SERVICE 4: AUDIT MANAGEMENT
-- ============================================================================

CREATE TYPE audit_type AS ENUM (
  'STATUTORY_AUDIT',
  'SPECIAL_AUDIT',
  'INVESTIGATIVE_AUDIT',
  'FORENSIC_AUDIT',
  'INTERNAL_AUDIT'
);

CREATE TABLE IF NOT EXISTS audit_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number text UNIQUE NOT NULL,
  cooperative_id uuid REFERENCES cooperatives(id) ON DELETE CASCADE,
  audit_type audit_type NOT NULL,
  financial_year integer NOT NULL,
  
  -- Auditor Details
  auditor_id uuid REFERENCES users(id),
  audit_firm_name text NOT NULL,
  auditor_certification_number text,
  
  -- Audit Details
  audit_start_date date NOT NULL,
  audit_end_date date,
  audit_period_from date NOT NULL,
  audit_period_to date NOT NULL,
  
  -- Findings
  audit_opinion text,
  findings_summary text,
  recommendations text,
  audit_report_url text,
  management_response_url text,
  
  -- Review
  status application_status DEFAULT 'SUBMITTED',
  submitted_at timestamptz DEFAULT now(),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SERVICE 5: DISPUTE RESOLUTION
-- ============================================================================

CREATE TYPE dispute_type AS ENUM (
  'MEMBER_VS_COOPERATIVE',
  'MEMBER_VS_MEMBER',
  'OFFICIAL_MISCONDUCT',
  'FINANCIAL_IRREGULARITY',
  'ELECTORAL_DISPUTE',
  'GOVERNANCE_ISSUE',
  'OTHER'
);

CREATE TYPE dispute_status AS ENUM (
  'LODGED',
  'UNDER_INVESTIGATION',
  'MEDIATION',
  'ARBITRATION',
  'RESOLVED',
  'REFERRED_TO_COURT',
  'WITHDRAWN',
  'DISMISSED'
);

CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_number text UNIQUE NOT NULL,
  cooperative_id uuid REFERENCES cooperatives(id) ON DELETE CASCADE,
  dispute_type dispute_type NOT NULL,
  
  -- Parties
  complainant_name text NOT NULL,
  complainant_contact text,
  respondent_name text NOT NULL,
  respondent_contact text,
  
  -- Dispute Details
  description text NOT NULL,
  date_of_incident date,
  supporting_documents_url text,
  
  -- Resolution Process
  status dispute_status DEFAULT 'LODGED',
  assigned_officer uuid REFERENCES users(id),
  investigation_notes text,
  resolution_notes text,
  resolution_date date,
  
  -- Dates
  lodged_by uuid REFERENCES users(id),
  lodged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SERVICE 6: LIQUIDATION MANAGEMENT
-- ============================================================================

CREATE TYPE liquidation_status AS ENUM (
  'APPLICATION_SUBMITTED',
  'UNDER_REVIEW',
  'LIQUIDATOR_APPOINTED',
  'IN_PROGRESS',
  'ASSETS_DISTRIBUTED',
  'COMPLETED',
  'CANCELLED'
);

CREATE TABLE IF NOT EXISTS liquidation_cases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_number text UNIQUE NOT NULL,
  cooperative_id uuid REFERENCES cooperatives(id) ON DELETE CASCADE,
  
  -- Application Details
  reason text NOT NULL,
  application_date date NOT NULL,
  resolution_minutes_url text,
  
  -- Liquidator Details
  liquidator_id uuid REFERENCES users(id),
  liquidator_name text,
  liquidator_appointment_date date,
  
  -- Financial Details
  total_assets decimal(15,2),
  total_liabilities decimal(15,2),
  net_position decimal(15,2),
  
  -- Process
  status liquidation_status DEFAULT 'APPLICATION_SUBMITTED',
  progress_notes text,
  final_report_url text,
  completion_date date,
  
  -- Tracking
  submitted_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SERVICE 7: FINANCIAL REPORTING
-- ============================================================================

CREATE TABLE IF NOT EXISTS financial_statements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cooperative_id uuid REFERENCES cooperatives(id) ON DELETE CASCADE,
  financial_year integer NOT NULL,
  
  -- Income Statement
  total_revenue decimal(15,2) DEFAULT 0,
  total_expenses decimal(15,2) DEFAULT 0,
  net_income decimal(15,2) DEFAULT 0,
  
  -- Balance Sheet
  total_assets decimal(15,2) DEFAULT 0,
  total_liabilities decimal(15,2) DEFAULT 0,
  total_equity decimal(15,2) DEFAULT 0,
  
  -- Additional Metrics
  member_deposits decimal(15,2) DEFAULT 0,
  loans_outstanding decimal(15,2) DEFAULT 0,
  share_capital decimal(15,2) DEFAULT 0,
  reserves decimal(15,2) DEFAULT 0,
  
  -- Documents
  statement_url text,
  notes_url text,
  
  -- Submission
  submitted_by uuid REFERENCES users(id),
  submitted_at timestamptz,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(cooperative_id, financial_year)
);

-- ============================================================================
-- SERVICE 8: LOANS & ADVANCES
-- ============================================================================

CREATE TYPE loan_status AS ENUM (
  'APPLIED',
  'UNDER_REVIEW',
  'APPROVED',
  'DISBURSED',
  'REJECTED',
  'CANCELLED'
);

CREATE TABLE IF NOT EXISTS loans_advances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_number text UNIQUE NOT NULL,
  cooperative_id uuid REFERENCES cooperatives(id) ON DELETE CASCADE,
  
  -- Loan Details
  loan_purpose text NOT NULL,
  amount_requested decimal(15,2) NOT NULL,
  amount_approved decimal(15,2),
  interest_rate decimal(5,2),
  repayment_period_months integer,
  
  -- Supporting Documents
  business_plan_url text,
  financial_projections_url text,
  collateral_documents_url text,
  
  -- Processing
  status loan_status DEFAULT 'APPLIED',
  applied_by uuid REFERENCES users(id),
  applied_at timestamptz DEFAULT now(),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  review_notes text,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  disbursed_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SERVICE 9: REVENUE & PAYMENTS
-- ============================================================================

CREATE TYPE payment_type AS ENUM (
  'REGISTRATION_FEE',
  'ANNUAL_LEVY',
  'AUDIT_FEE',
  'AMENDMENT_FEE',
  'TRAINING_FEE',
  'PENALTY',
  'OTHER'
);

CREATE TYPE payment_status AS ENUM (
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REFUNDED'
);

CREATE TABLE IF NOT EXISTS revenue_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number text UNIQUE NOT NULL,
  cooperative_id uuid REFERENCES cooperatives(id),
  
  -- Payment Details
  payment_type payment_type NOT NULL,
  amount decimal(15,2) NOT NULL,
  currency text DEFAULT 'KES',
  description text,
  financial_year integer,
  
  -- Transaction
  status payment_status DEFAULT 'PENDING',
  payment_method text,
  transaction_reference text,
  paid_at timestamptz,
  
  -- Tracking
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SERVICE 10: GRANTS MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS grant_applications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_number text UNIQUE NOT NULL,
  cooperative_id uuid REFERENCES cooperatives(id) ON DELETE CASCADE,
  
  -- Grant Details
  grant_type text NOT NULL,
  amount_requested decimal(15,2) NOT NULL,
  amount_approved decimal(15,2),
  grant_purpose text NOT NULL,
  project_description text,
  expected_outcomes text,
  
  -- Documents
  project_proposal_url text,
  budget_url text,
  supporting_documents_url text,
  
  -- Processing
  status application_status DEFAULT 'DRAFT',
  submitted_by uuid REFERENCES users(id),
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  review_notes text,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  disbursed_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SERVICES 11-13: TRAINING & DEVELOPMENT
-- ============================================================================

CREATE TYPE training_status AS ENUM (
  'SCHEDULED',
  'ONGOING',
  'COMPLETED',
  'CANCELLED',
  'POSTPONED'
);

CREATE TABLE IF NOT EXISTS training_programs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  
  -- Training Details
  trainer_id uuid REFERENCES users(id),
  tenant_id uuid REFERENCES tenants(id),
  venue text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  duration_days integer,
  max_participants integer,
  
  -- Content
  objectives text,
  curriculum_url text,
  materials_url text,
  
  -- Fees
  fee_amount decimal(10,2) DEFAULT 0,
  
  -- Status
  status training_status DEFAULT 'SCHEDULED',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_registrations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id uuid REFERENCES training_programs(id) ON DELETE CASCADE,
  
  -- Participant Details
  participant_user_id uuid REFERENCES users(id),
  cooperative_id uuid REFERENCES cooperatives(id),
  full_name text NOT NULL,
  id_number text NOT NULL,
  phone text NOT NULL,
  email text,
  
  -- Registration
  registration_date timestamptz DEFAULT now(),
  payment_status payment_status DEFAULT 'PENDING',
  payment_reference text,
  
  -- Completion
  attended boolean DEFAULT false,
  certificate_issued boolean DEFAULT false,
  certificate_url text,
  
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trainer_certifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  
  -- Certification Details
  certification_number text UNIQUE NOT NULL,
  full_name text NOT NULL,
  id_number text NOT NULL,
  specialization text,
  
  -- Validity
  issue_date date NOT NULL,
  expiry_date date NOT NULL,
  is_active boolean DEFAULT true,
  
  -- Documents
  certificate_url text,
  credentials_url text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SERVICES 14-17: INFORMATION & RESEARCH
-- ============================================================================

CREATE TABLE IF NOT EXISTS cooperative_statistics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid REFERENCES tenants(id),
  
  -- Period
  reporting_period text NOT NULL,
  year integer NOT NULL,
  quarter integer,
  
  -- Statistics
  total_cooperatives integer DEFAULT 0,
  new_registrations integer DEFAULT 0,
  active_cooperatives integer DEFAULT 0,
  total_members integer DEFAULT 0,
  total_share_capital decimal(15,2) DEFAULT 0,
  total_assets decimal(15,2) DEFAULT 0,
  
  -- By Type
  statistics_by_type jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS research_publications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  author text NOT NULL,
  
  -- Publication Details
  abstract text,
  publication_date date,
  category text,
  keywords text[],
  
  -- Documents
  document_url text,
  
  -- Visibility
  is_public boolean DEFAULT true,
  
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TYPE inquiry_status AS ENUM (
  'SUBMITTED',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED'
);

CREATE TABLE IF NOT EXISTS inquiry_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_number text UNIQUE NOT NULL,
  
  -- Requester Details
  requester_user_id uuid REFERENCES users(id),
  requester_name text NOT NULL,
  requester_email text NOT NULL,
  requester_phone text,
  
  -- Inquiry Details
  subject text NOT NULL,
  description text NOT NULL,
  category text,
  
  -- Response
  status inquiry_status DEFAULT 'SUBMITTED',
  assigned_to uuid REFERENCES users(id),
  response text,
  response_documents_url text,
  resolved_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS advisory_services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_number text UNIQUE NOT NULL,
  cooperative_id uuid REFERENCES cooperatives(id),
  
  -- Service Details
  service_type text NOT NULL,
  description text NOT NULL,
  objectives text,
  
  -- Advisor
  advisor_id uuid REFERENCES users(id),
  
  -- Schedule
  start_date date,
  end_date date,
  
  -- Deliverables
  status application_status DEFAULT 'SUBMITTED',
  progress_notes text,
  report_url text,
  
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- AUDIT LOGGING
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  tenant_id uuid REFERENCES tenants(id),
  
  -- Action Details
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  
  -- Changes
  old_values jsonb,
  new_values jsonb,
  
  -- Context
  ip_address inet,
  user_agent text,
  
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperative_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperative_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperative_officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE amendment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidation_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperative_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisory_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Authenticated users can read tenants
CREATE POLICY "Authenticated users can read tenants"
  ON tenants FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can read cooperative types
CREATE POLICY "Authenticated users can read cooperative types"
  ON cooperative_types FOR SELECT
  TO authenticated
  USING (true);

-- Users can read cooperatives in their tenant
CREATE POLICY "Users can read cooperatives in their tenant"
  ON cooperatives FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND (
        user_roles.role = 'SUPER_ADMIN'
        OR user_roles.tenant_id = cooperatives.tenant_id
      )
    )
  );

-- Public can read public research publications
CREATE POLICY "Public can read public research"
  ON research_publications FOR SELECT
  TO authenticated
  USING (is_public = true);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON user_roles(tenant_id);

CREATE INDEX IF NOT EXISTS idx_cooperatives_tenant_id ON cooperatives(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cooperatives_status ON cooperatives(status);
CREATE INDEX IF NOT EXISTS idx_cooperatives_registration_number ON cooperatives(registration_number);

CREATE INDEX IF NOT EXISTS idx_cooperative_members_cooperative_id ON cooperative_members(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_cooperative_members_user_id ON cooperative_members(user_id);

CREATE INDEX IF NOT EXISTS idx_registration_apps_tenant_id ON registration_applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_registration_apps_status ON registration_applications(status);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_cooperative_id ON compliance_reports(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_audit_reports_cooperative_id ON audit_reports(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_disputes_cooperative_id ON disputes(cooperative_id);

CREATE INDEX IF NOT EXISTS idx_financial_statements_cooperative_id ON financial_statements(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_training_programs_tenant_id ON training_programs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
