/*
  # Add Complaints Support to inquiry_requests Table
  
  This migration extends the inquiry_requests table to support complaints functionality
  while maintaining backward compatibility with existing inquiries.
*/

-- Create complaint priority enum
CREATE TYPE complaint_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- Create complaint category enum  
CREATE TYPE complaint_category AS ENUM (
  'GOVERNANCE',
  'FINANCIAL_MISMANAGEMENT', 
  'MEMBER_DISPUTE',
  'SERVICE_DELIVERY',
  'FRAUD',
  'CORRUPTION',
  'OTHER'
);

-- Create complaint status enum
CREATE TYPE complaint_status AS ENUM (
  'RECEIVED',
  'INVESTIGATING', 
  'RESOLVED',
  'DISMISSED'
);

-- Add new columns to inquiry_requests table for complaints support
ALTER TABLE inquiry_requests 
  ADD COLUMN IF NOT EXISTS cooperative_id uuid REFERENCES cooperatives(id),
  ADD COLUMN IF NOT EXISTS complaint_category complaint_category,
  ADD COLUMN IF NOT EXISTS priority complaint_priority DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS complaint_status complaint_status DEFAULT 'RECEIVED',
  ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS evidence_documents text[], -- Array of file paths
  ADD COLUMN IF NOT EXISTS investigation_notes text,
  ADD COLUMN IF NOT EXISTS resolution_notes text,
  ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES users(id);

-- Create index for faster complaint queries
CREATE INDEX IF NOT EXISTS idx_inquiry_cooperative ON inquiry_requests(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_category ON inquiry_requests(complaint_category);
CREATE INDEX IF NOT EXISTS idx_inquiry_priority ON inquiry_requests(priority);
CREATE INDEX IF NOT EXISTS idx_inquiry_complaint_status ON inquiry_requests(complaint_status);
CREATE INDEX IF NOT EXISTS idx_inquiry_assigned_to ON inquiry_requests(assigned_to);

-- Update the inquiry_number column comment to indicate it can be used for complaint numbers too
COMMENT ON COLUMN inquiry_requests.inquiry_number IS 'Unique number for inquiry/complaint (e.g., INQ-2024-XXXX or CPL-2024-XXXX)';
