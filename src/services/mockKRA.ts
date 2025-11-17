import { supabase } from '../lib/supabase';

export type ComplianceStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING';

export interface KRARecord {
  kra_pin: string;
  taxpayer_name: string;
  compliance_status: ComplianceStatus;
  compliance_certificate_number?: string;
  outstanding_tax_amount: number;
  last_filing_date?: string;
  vat_obligation: boolean;
  paye_obligation: boolean;
  corporation_tax_obligation: boolean;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockKRAService = {
  async verifyPIN(kraPin: string): Promise<{ success: boolean; data?: KRARecord; error?: string }> {
    await delay(1000 + Math.random() * 1000);

    const pinRegex = /^[A-Z]\d{9}[A-Z]$/;
    if (!kraPin || !pinRegex.test(kraPin)) {
      return {
        success: false,
        error: 'Invalid KRA PIN format. Expected format: A000000000A'
      };
    }

    try {
      const { data, error } = await supabase
        .from('mock_kra_records')
        .select('*')
        .eq('kra_pin', kraPin)
        .single();

      if (error || !data) {
        return {
          success: false,
          error: 'KRA PIN not found in iTax system'
        };
      }

      const kraRecord: KRARecord = {
        ...data,
        compliance_certificate_number: data.compliance_status === 'COMPLIANT' 
          ? `KRA-CC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`
          : undefined
      };

      return {
        success: true,
        data: kraRecord
      };
    } catch (err) {
      console.error('KRA verification error:', err);
      return {
        success: false,
        error: 'KRA iTax service temporarily unavailable. Please try again later.'
      };
    }
  },

  async recordVerification(
    kraPin: string, 
    complianceStatus: ComplianceStatus, 
    certificateNumber: string | undefined,
    verifiedBy: string
  ): Promise<void> {
    try {
      await supabase
        .from('kra_verifications')
        .insert({
          pin_number: kraPin,
          compliance_status: complianceStatus,
          certificate_number: certificateNumber,
          verified_by: verifiedBy,
          verified_at: new Date().toISOString()
        });
    } catch (err) {
      console.error('Error recording KRA verification:', err);
    }
  }
};
