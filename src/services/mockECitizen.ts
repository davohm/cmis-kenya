import { supabase } from '../lib/supabase';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type PaymentMethod = 'MPESA' | 'CARD';

export interface PaymentTransaction {
  id?: string;
  bill_reference: string;
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
  initiated_at?: string;
  completed_at?: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const SERVICE_FEES = {
  'COOPERATIVE_REGISTRATION': 2000,
  'AMENDMENT_REQUEST': 1000,
  'OFFICIAL_SEARCH': 500,
  'CERTIFICATE_COPY': 300
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
    }
  ): Promise<{ success: boolean; data?: PaymentTransaction; error?: string }> {
    await delay(500);

    const year = new Date().getFullYear();
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const billReference = `BILL-${year}-${randomNum}`;

    const transaction: PaymentTransaction = {
      bill_reference: billReference,
      payment_method: paymentMethod,
      payment_status: 'PENDING',
      service_type: serviceType,
      amount: amount,
      payer_name: payerDetails.name,
      payer_phone: payerDetails.phone,
      payer_email: payerDetails.email,
      mpesa_number: payerDetails.mpesaNumber,
      card_last_four: payerDetails.cardLastFour
    };

    try {
      const { data, error } = await supabase
        .from('payment_transactions')
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

  async processPayment(billReference: string): Promise<{ success: boolean; data?: PaymentTransaction; error?: string }> {
    await delay(2000 + Math.random() * 2000);

    const successRate = 0.9;
    const isSuccessful = Math.random() < successRate;

    const receiptNumber = isSuccessful 
      ? `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      : undefined;

    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .update({
          payment_status: isSuccessful ? 'COMPLETED' : 'FAILED',
          receipt_number: receiptNumber,
          completed_at: new Date().toISOString()
        })
        .eq('bill_reference', billReference)
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

  async getPaymentStatus(billReference: string): Promise<{ success: boolean; data?: PaymentTransaction; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('bill_reference', billReference)
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
