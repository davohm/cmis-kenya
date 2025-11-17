-- Migration: Create Enterprise Document Management System (EDMS) Schema
-- Created: 2025-11-17
-- Description: Comprehensive document management system for country-wide document storage,
--              search, filtering by county, cooperative, and sectoral category

-- ================================================================
-- 1. DOCUMENTS TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_number text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  document_type text NOT NULL, -- REGISTRATION, COMPLIANCE, AUDIT, AMENDMENT, FINANCIAL, LEGAL, etc.
  cooperative_id uuid REFERENCES cooperatives(id) ON DELETE SET NULL,
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  sectoral_category text, -- SACCO, AGRICULTURAL, DAIRY, TRANSPORT, MARKETING, HOUSING, etc.
  storage_path text NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'documents',
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  uploaded_by uuid REFERENCES users(id) NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  status text DEFAULT 'ACTIVE', -- ACTIVE, ARCHIVED, DELETED
  version_number integer DEFAULT 1,
  parent_document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ================================================================
-- 2. DOCUMENT VERSIONS TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  uploaded_by uuid REFERENCES users(id) NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  change_summary text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id, version_number)
);

-- ================================================================
-- 3. DOCUMENT ACCESS LOGS TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS document_access_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  action text NOT NULL, -- VIEW, DOWNLOAD, UPLOAD, UPDATE, DELETE
  ip_address inet,
  user_agent text,
  accessed_at timestamptz DEFAULT now()
);

-- ================================================================
-- 4. DOCUMENT TAGS TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS document_tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  category text DEFAULT 'USER_DEFINED', -- SYSTEM, USER_DEFINED
  color text,
  description text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- ================================================================
-- 5. INDEXES FOR PERFORMANCE
-- ================================================================

-- Indexes for documents table
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_cooperative_id ON documents(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_sectoral_category ON documents(sectoral_category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_parent_document_id ON documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_number ON documents(document_number);

-- GIN index for tags array search
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);

-- GIN index for metadata JSONB search
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING GIN(metadata);

-- Full-text search index on title and description
CREATE INDEX IF NOT EXISTS idx_documents_fulltext_search ON documents USING GIN(
  to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);

-- Indexes for document_versions
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_version_number ON document_versions(document_id, version_number DESC);

-- Indexes for document_access_logs
CREATE INDEX IF NOT EXISTS idx_document_access_logs_document_id ON document_access_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_user_id ON document_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_accessed_at ON document_access_logs(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_action ON document_access_logs(action);

-- Indexes for document_tags
CREATE INDEX IF NOT EXISTS idx_document_tags_category ON document_tags(category);
CREATE INDEX IF NOT EXISTS idx_document_tags_name ON document_tags(name);

-- ================================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 7. FUNCTION TO GENERATE DOCUMENT NUMBER
-- ================================================================

CREATE OR REPLACE FUNCTION generate_document_number()
RETURNS text AS $$
DECLARE
  new_number text;
  year_part text;
  seq_num integer;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Get next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(document_number FROM '/(\d+)$') AS INTEGER)), 0) + 1
  INTO seq_num
  FROM documents
  WHERE document_number LIKE 'DOC/' || year_part || '/%';
  
  new_number := 'DOC/' || year_part || '/' || LPAD(seq_num::text, 6, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 8. FUNCTION TO UPDATE UPDATED_AT TIMESTAMP
-- ================================================================

CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

-- ================================================================
-- END OF MIGRATION
-- ================================================================

