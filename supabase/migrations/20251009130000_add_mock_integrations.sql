-- Migration: Add Mock Integration Tables
-- Description: Tables to simulate Kenyan government and financial service integrations

-- Mock IPRS (Integrated Population Registration System) Records
CREATE TABLE IF NOT EXISTS mock_iprs_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_number VARCHAR(8) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('MALE', 'FEMALE')),
  citizenship_status VARCHAR(50) NOT NULL DEFAULT 'CITIZEN',
  id_issue_date DATE NOT NULL,
  id_expiry_date DATE NOT NULL,
  validation_status VARCHAR(20) NOT NULL DEFAULT 'VERIFIED' CHECK (validation_status IN ('VERIFIED', 'NOT_FOUND', 'EXPIRED', 'INVALID')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mock Payment Transactions (eCitizen Gateway)
CREATE TABLE IF NOT EXISTS mock_payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_reference VARCHAR(100) NOT NULL UNIQUE,
  receipt_number VARCHAR(100),
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('MPESA', 'CARD', 'BANK_TRANSFER')),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  service_type VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payer_name VARCHAR(255) NOT NULL,
  payer_phone VARCHAR(20),
  payer_email VARCHAR(255),
  mpesa_number VARCHAR(20),
  card_last_four VARCHAR(4),
  bank_name VARCHAR(100),
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mock KRA (Kenya Revenue Authority) Records
CREATE TABLE IF NOT EXISTS mock_kra_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kra_pin VARCHAR(11) NOT NULL UNIQUE,
  taxpayer_name VARCHAR(255) NOT NULL,
  compliance_status VARCHAR(50) NOT NULL DEFAULT 'COMPLIANT' CHECK (compliance_status IN ('COMPLIANT', 'NON_COMPLIANT', 'SUSPENDED')),
  outstanding_tax_amount DECIMAL(15, 2) DEFAULT 0,
  last_filing_date DATE,
  vat_obligation BOOLEAN DEFAULT false,
  paye_obligation BOOLEAN DEFAULT false,
  corporation_tax_obligation BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mock SASRA (SACCO Societies Regulatory Authority) Compliance
CREATE TABLE IF NOT EXISTS mock_sasra_compliance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cooperative_id UUID REFERENCES cooperatives(id) ON DELETE CASCADE,
  license_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (license_status IN ('ACTIVE', 'SUSPENDED', 'REVOKED')),
  last_audit_date DATE,
  capital_adequacy_ratio DECIMAL(5, 2),
  liquidity_ratio DECIMAL(5, 2),
  npl_ratio DECIMAL(5, 2),
  compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
  regulatory_alerts TEXT[],
  supervisor_name VARCHAR(255),
  supervisor_phone VARCHAR(20),
  supervisor_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cooperative_id)
);

-- Create indexes
CREATE INDEX idx_iprs_id_number ON mock_iprs_records(id_number);
CREATE INDEX idx_payment_transactions_ref ON mock_payment_transactions(transaction_reference);
CREATE INDEX idx_payment_transactions_status ON mock_payment_transactions(payment_status);
CREATE INDEX idx_kra_pin ON mock_kra_records(kra_pin);
CREATE INDEX idx_sasra_cooperative ON mock_sasra_compliance(cooperative_id);

-- Insert sample IPRS records for testing
INSERT INTO mock_iprs_records (id_number, full_name, date_of_birth, gender, citizenship_status, id_issue_date, id_expiry_date, validation_status) VALUES
('12345678', 'JOHN KAMAU MWANGI', '1985-03-15', 'MALE', 'CITIZEN', '2015-01-10', '2025-01-10', 'VERIFIED'),
('23456789', 'MARY WANJIKU NJERI', '1990-07-22', 'FEMALE', 'CITIZEN', '2016-05-20', '2026-05-20', 'VERIFIED'),
('34567890', 'PETER OCHIENG OTIENO', '1988-11-30', 'MALE', 'CITIZEN', '2014-03-15', '2024-03-15', 'VERIFIED'),
('45678901', 'GRACE AKINYI ADHIAMBO', '1992-02-14', 'FEMALE', 'CITIZEN', '2017-08-10', '2027-08-10', 'VERIFIED'),
('56789012', 'DAVID KIPCHOGE ROTICH', '1987-09-05', 'MALE', 'CITIZEN', '2013-12-01', '2023-12-01', 'EXPIRED'),
('67890123', 'ELIZABETH NYAMBURA KARANJA', '1995-04-18', 'FEMALE', 'CITIZEN', '2018-02-25', '2028-02-25', 'VERIFIED'),
('78901234', 'SAMUEL MUTUA MUSYOKA', '1983-06-12', 'MALE', 'CITIZEN', '2019-07-15', '2029-07-15', 'VERIFIED'),
('89012345', 'FAITH CHEBET KOECH', '1991-10-28', 'FEMALE', 'CITIZEN', '2016-11-30', '2026-11-30', 'VERIFIED'),
('90123456', 'JAMES OTIENO OMONDI', '1989-01-07', 'MALE', 'CITIZEN', '2015-04-20', '2025-04-20', 'VERIFIED'),
('01234567', 'JANE DOE TEST', '1990-01-01', 'FEMALE', 'CITIZEN', '2010-01-01', '2020-01-01', 'EXPIRED');

-- Insert sample KRA records for testing
INSERT INTO mock_kra_records (kra_pin, taxpayer_name, compliance_status, outstanding_tax_amount, last_filing_date, vat_obligation, paye_obligation, corporation_tax_obligation) VALUES
('A001234567M', 'JOHN KAMAU MWANGI', 'COMPLIANT', 0, '2024-09-30', true, true, false),
('A002345678K', 'MARY WANJIKU NJERI', 'COMPLIANT', 0, '2024-09-30', true, true, true),
('A003456789P', 'PETER OCHIENG OTIENO', 'NON_COMPLIANT', 45000.00, '2024-03-31', true, true, false),
('A004567890N', 'GRACE AKINYI ADHIAMBO', 'COMPLIANT', 0, '2024-09-30', false, true, false),
('A005678901R', 'DAVID KIPCHOGE ROTICH', 'SUSPENDED', 125000.00, '2023-12-31', true, true, true),
('A006789012L', 'ELIZABETH NYAMBURA KARANJA', 'COMPLIANT', 0, '2024-09-30', true, true, false),
('A007890123T', 'SAMUEL MUTUA MUSYOKA', 'COMPLIANT', 0, '2024-09-30', true, true, true),
('A008901234C', 'FAITH CHEBET KOECH', 'NON_COMPLIANT', 23500.00, '2024-06-30', true, true, false),
('A009012345W', 'JAMES OTIENO OMONDI', 'COMPLIANT', 0, '2024-09-30', false, true, false),
('A000000000Z', 'TEST USER INVALID', 'SUSPENDED', 500000.00, '2022-12-31', true, true, true);

-- Add update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mock_iprs_updated_at BEFORE UPDATE ON mock_iprs_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mock_payment_updated_at BEFORE UPDATE ON mock_payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mock_kra_updated_at BEFORE UPDATE ON mock_kra_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mock_sasra_updated_at BEFORE UPDATE ON mock_sasra_compliance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
