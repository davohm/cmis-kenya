-- Add search indexes for global search performance optimization

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

-- Enable pg_trgm extension for trigram matching (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

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

-- Comment explaining index strategy
COMMENT ON INDEX idx_cooperatives_name_search IS 'Full-text search index for cooperative names using English dictionary';
COMMENT ON INDEX idx_cooperatives_name_trgm IS 'Trigram index for fuzzy matching on cooperative names';
COMMENT ON INDEX idx_users_full_name_search IS 'Full-text search index for user full names';
COMMENT ON INDEX idx_applications_proposed_name_search IS 'Full-text search index for application proposed names';
