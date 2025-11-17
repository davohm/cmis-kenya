import { supabase } from '../lib/supabase';

export type ValidationStatus = 'VERIFIED' | 'NOT_FOUND' | 'EXPIRED' | 'INVALID';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type PaymentMethod = 'MPESA' | 'CARD' | 'BANK_TRANSFER';
export type ComplianceStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'SUSPENDED';
export type LicenseStatus = 'ACTIVE' | 'SUSPENDED' | 'REVOKED';

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

export interface PaymentTransaction {
  id?: string;
  transaction_reference: string;
  receipt_number?: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  service_type: string;
  amount: number;
  payer_name: string;
  payer_phone?: string;
  payer_email?: string;
  mpesa_number?: string;
  card_last_four?: string;
  bank_name?: string;
  initiated_at?: string;
  completed_at?: string;
}

export interface KRARecord {
  kra_pin: string;
  taxpayer_name: string;
  compliance_status: ComplianceStatus;
  outstanding_tax_amount: number;
  last_filing_date?: string;
  vat_obligation: boolean;
  paye_obligation: boolean;
  corporation_tax_obligation: boolean;
}

export interface SASRACompliance {
  cooperative_id: string;
  license_status: LicenseStatus;
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

export const mockIPRSService = {
  async verifyNationalID(idNumber: string): Promise<{ success: boolean; data?: IPRSRecord; error?: string }> {
    await delay(1000 + Math.random() * 1000);

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
  }
};

export const SERVICE_FEES = {
  'COOPERATIVE_REGISTRATION': 5000,
  'AMENDMENT_REQUEST': 2000,
  'OFFICIAL_SEARCH': 500,
  'AUDITOR_APPLICATION': 3000,
  'TRAINER_APPLICATION': 2500
};

export const mockECitizenService = {
  async initiatePayment(
    serviceType: string,
    amount: number,
    paymentMethod: PaymentMethod,
    payerDetails: {
      name: string;
      phone?: string;
      email?: string;
      mpesaNumber?: string;
      cardLastFour?: string;
      bankName?: string;
    }
  ): Promise<{ success: boolean; data?: PaymentTransaction; error?: string }> {
    await delay(500);

    const transactionRef = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const transaction: PaymentTransaction = {
      transaction_reference: transactionRef,
      payment_method: paymentMethod,
      payment_status: 'PENDING',
      service_type: serviceType,
      amount: amount,
      payer_name: payerDetails.name,
      payer_phone: payerDetails.phone,
      payer_email: payerDetails.email,
      mpesa_number: payerDetails.mpesaNumber,
      card_last_four: payerDetails.cardLastFour,
      bank_name: payerDetails.bankName
    };

    try {
      const { data, error } = await supabase
        .from('mock_payment_transactions')
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as PaymentTransaction
      };
    } catch (err) {
      console.error('Payment initiation error:', err);
      return {
        success: false,
        error: 'Failed to initiate payment. Please try again.'
      };
    }
  },

  async processPayment(transactionRef: string): Promise<{ success: boolean; data?: PaymentTransaction; error?: string }> {
    await delay(2000 + Math.random() * 2000);

    const successRate = 0.85;
    const isSuccessful = Math.random() < successRate;

    const receiptNumber = isSuccessful 
      ? `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      : undefined;

    try {
      const { data, error } = await supabase
        .from('mock_payment_transactions')
        .update({
          payment_status: isSuccessful ? 'COMPLETED' : 'FAILED',
          receipt_number: receiptNumber,
          completed_at: new Date().toISOString()
        })
        .eq('transaction_reference', transactionRef)
        .select()
        .single();

      if (error) throw error;

      return {
        success: isSuccessful,
        data: data as PaymentTransaction,
        error: isSuccessful ? undefined : 'Payment failed. Please try again or use a different payment method.'
      };
    } catch (err) {
      console.error('Payment processing error:', err);
      return {
        success: false,
        error: 'Payment processing error. Please contact support.'
      };
    }
  },

  async getPaymentStatus(transactionRef: string): Promise<{ success: boolean; data?: PaymentTransaction; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('mock_payment_transactions')
        .select('*')
        .eq('transaction_reference', transactionRef)
        .single();

      if (error || !data) {
        return {
          success: false,
          error: 'Transaction not found'
        };
      }

      return {
        success: true,
        data: data as PaymentTransaction
      };
    } catch (err) {
      console.error('Get payment status error:', err);
      return {
        success: false,
        error: 'Failed to retrieve payment status'
      };
    }
  }
};

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

      return {
        success: true,
        data: data as KRARecord
      };
    } catch (err) {
      console.error('KRA verification error:', err);
      return {
        success: false,
        error: 'KRA iTax service temporarily unavailable. Please try again later.'
      };
    }
  }
};

export const mockSASRAService = {
  async checkCompliance(cooperativeId: string): Promise<{ success: boolean; data?: SASRACompliance; error?: string }> {
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
          license_status: 'ACTIVE',
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

      return {
        success: true,
        data: data as SASRACompliance
      };
    } catch (err) {
      console.error('SASRA compliance check error:', err);
      return {
        success: false,
        error: 'SASRA service temporarily unavailable. Please try again later.'
      };
    }
  }
};
