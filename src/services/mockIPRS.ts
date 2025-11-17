import { supabase } from '../lib/supabase';

export type ValidationStatus = 'VERIFIED' | 'NOT_FOUND' | 'EXPIRED' | 'INVALID';

export interface IPRSRecord {
  id_number: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  citizenship_status: string;
  id_issue_date: string;
  id_expiry_date: string;
  validation_status: ValidationStatus;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockIPRSService = {
  async verifyNationalID(idNumber: string): Promise<{ success: boolean; data?: IPRSRecord; error?: string }> {
    await delay(100);

    if (!idNumber || idNumber.length !== 8) {
      return {
        success: false,
        error: 'Invalid ID number format. Must be 8 digits.'
      };
    }

    try {
      const { data, error } = await supabase
        .from('mock_iprs_records')
        .select('*')
        .eq('id_number', idNumber)
        .single();

      if (error || !data) {
        return {
          success: false,
          error: 'ID number not found in IPRS database'
        };
      }

      if (data.validation_status === 'EXPIRED') {
        return {
          success: false,
          error: 'ID has expired. Please renew your national ID.'
        };
      }

      if (data.validation_status === 'INVALID') {
        return {
          success: false,
          error: 'ID number is invalid or has been revoked.'
        };
      }

      return {
        success: true,
        data: data as IPRSRecord
      };
    } catch (err) {
      console.error('IPRS verification error:', err);
      return {
        success: false,
        error: 'IPRS service temporarily unavailable. Please try again later.'
      };
    }
  },

  async recordVerification(idNumber: string, fullName: string, verifiedBy: string): Promise<void> {
    try {
      await supabase
        .from('iprs_verifications')
        .insert({
          id_number: idNumber,
          full_name: fullName,
          verified_by: verifiedBy,
          verified_at: new Date().toISOString()
        });
    } catch (err) {
      console.error('Error recording IPRS verification:', err);
    }
  }
};
