import { supabase } from '../lib/supabase';

export type LicenseStatus = 'LICENSED' | 'SUSPENDED' | 'EXPIRED' | 'NOT_LICENSED';

export interface SASRACompliance {
  cooperative_id: string;
  license_number?: string;
  license_status: LicenseStatus;
  license_expiry_date?: string;
  last_audit_date?: string;
  capital_adequacy_ratio?: number;
  liquidity_ratio?: number;
  npl_ratio?: number;
  compliance_score: number;
  regulatory_alerts?: string[];
  supervisor_name?: string;
  supervisor_phone?: string;
  supervisor_email?: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockSASRAService = {
  async checkLicense(cooperativeId: string): Promise<{ success: boolean; data?: SASRACompliance; error?: string }> {
    await delay(1500 + Math.random() * 1000);

    try {
      const { data, error } = await supabase
        .from('mock_sasra_compliance')
        .select('*')
        .eq('cooperative_id', cooperativeId)
        .single();

      if (error || !data) {
        const mockData: SASRACompliance = {
          cooperative_id: cooperativeId,
          license_number: `SASRA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          license_status: 'LICENSED',
          license_expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          compliance_score: 75 + Math.floor(Math.random() * 20),
          capital_adequacy_ratio: 10 + Math.random() * 5,
          liquidity_ratio: 15 + Math.random() * 10,
          npl_ratio: Math.random() * 5,
          regulatory_alerts: [],
          supervisor_name: 'SASRA Compliance Officer',
          supervisor_phone: '+254712345678',
          supervisor_email: 'compliance@sasra.go.ke'
        };

        const { data: inserted, error: insertError } = await supabase
          .from('mock_sasra_compliance')
          .insert(mockData)
          .select()
          .single();

        if (insertError) {
          return {
            success: true,
            data: mockData
          };
        }

        return {
          success: true,
          data: inserted as SASRACompliance
        };
      }

      const sasraData: SASRACompliance = {
        ...data,
        license_number: data.license_status === 'LICENSED' || data.license_status === 'SUSPENDED'
          ? `SASRA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
          : undefined
      };

      return {
        success: true,
        data: sasraData
      };
    } catch (err) {
      console.error('SASRA compliance check error:', err);
      return {
        success: false,
        error: 'SASRA service temporarily unavailable. Please try again later.'
      };
    }
  },

  async recordVerification(
    cooperativeId: string,
    licenseNumber: string | undefined,
    licenseStatus: LicenseStatus,
    expiryDate: string | undefined,
    verifiedBy: string
  ): Promise<void> {
    try {
      await supabase
        .from('sasra_verifications')
        .insert({
          cooperative_id: cooperativeId,
          license_number: licenseNumber,
          status: licenseStatus,
          expiry_date: expiryDate,
          verified_by: verifiedBy,
          verified_at: new Date().toISOString()
        });
    } catch (err) {
      console.error('Error recording SASRA verification:', err);
    }
  }
};
