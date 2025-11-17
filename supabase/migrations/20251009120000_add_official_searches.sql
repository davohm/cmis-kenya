-- Official Searches Service Tables
-- Enables anyone to search cooperatives and obtain official certificates

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
    payment_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
    payment_method VARCHAR(50), -- MPESA, CARD, etc.
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- Indexes
    CONSTRAINT search_requests_payment_status_check CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED'))
);

-- Create indexes for better query performance
CREATE INDEX idx_search_requests_user_id ON public.search_requests(user_id);
CREATE INDEX idx_search_requests_cooperative_id ON public.search_requests(cooperative_id);
CREATE INDEX idx_search_requests_search_number ON public.search_requests(search_number);
CREATE INDEX idx_search_requests_certificate_number ON public.search_requests(certificate_number);
CREATE INDEX idx_search_requests_created_at ON public.search_requests(created_at DESC);
CREATE INDEX idx_search_requests_payment_status ON public.search_requests(payment_status);

-- Function to generate search number (SRH-YYYY-XXXX format)
CREATE OR REPLACE FUNCTION generate_search_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_part TEXT;
    next_sequence INTEGER;
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(search_number FROM 10) AS INTEGER)), 0) + 1
    INTO next_sequence
    FROM public.search_requests
    WHERE search_number LIKE 'SRH-' || year_part || '-%';
    
    -- Format sequence with leading zeros (4 digits)
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
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(certificate_number FROM 11) AS INTEGER)), 0) + 1
    INTO next_sequence
    FROM public.search_requests
    WHERE certificate_number LIKE 'CERT-' || year_part || '-%';
    
    -- Format sequence with leading zeros (4 digits)
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

CREATE TRIGGER trigger_set_search_number
    BEFORE INSERT ON public.search_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_search_number();

-- Trigger to update updated_at timestamp
CREATE TRIGGER trigger_search_requests_updated_at
    BEFORE UPDATE ON public.search_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.search_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for search_requests

-- Public can create search requests
CREATE POLICY "Anyone can create search requests"
    ON public.search_requests FOR INSERT
    WITH CHECK (true);

-- Users can view their own search requests
CREATE POLICY "Users can view own search requests"
    ON public.search_requests FOR SELECT
    USING (
        auth.uid() = user_id
        OR auth.uid() IN (
            SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'COUNTY_ADMIN')
        )
    );

-- Admins can view all search requests
CREATE POLICY "Admins can view all search requests"
    ON public.search_requests FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'COUNTY_ADMIN')
        )
    );

-- Users can update their own search requests
CREATE POLICY "Users can update own search requests"
    ON public.search_requests FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can update all search requests
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

COMMENT ON TABLE public.search_requests IS 'Tracks official searches for cooperatives and certificate requests';
COMMENT ON COLUMN public.search_requests.search_number IS 'Auto-generated unique search reference number (SRH-YYYY-XXXX)';
COMMENT ON COLUMN public.search_requests.certificate_number IS 'Unique certificate number when certificate is generated (CERT-YYYY-XXXX)';
COMMENT ON COLUMN public.search_requests.payment_reference IS 'eCitizen or payment gateway transaction reference';
