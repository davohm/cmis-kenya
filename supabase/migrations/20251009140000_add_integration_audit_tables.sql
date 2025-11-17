-- Migration: Add Integration Audit Trail Tables
-- Description: Tables to track all integration verifications and transactions

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

-- Create indexes for performance
CREATE INDEX idx_iprs_verifications_id_number ON iprs_verifications(id_number);
CREATE INDEX idx_iprs_verifications_verified_at ON iprs_verifications(verified_at DESC);
CREATE INDEX idx_payment_transactions_bill_ref ON payment_transactions(bill_reference);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(payment_status);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at DESC);
CREATE INDEX idx_kra_verifications_pin ON kra_verifications(pin_number);
CREATE INDEX idx_kra_verifications_verified_at ON kra_verifications(verified_at DESC);
CREATE INDEX idx_sasra_verifications_coop_id ON sasra_verifications(cooperative_id);
CREATE INDEX idx_sasra_verifications_verified_at ON sasra_verifications(verified_at DESC);
