import { useState } from 'react';
import { mockIPRSService, IPRSRecord } from '../services/mockIPRS';
import { mockECitizenService, PaymentTransaction, PaymentMethod } from '../services/mockECitizen';
import { mockKRAService, KRARecord } from '../services/mockKRA';
import { mockSASRAService, SASRACompliance } from '../services/mockSASRA';

export function useIPRSVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<IPRSRecord | null>(null);

  const verifyID = async (idNumber: string, verifiedBy?: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    const result = await mockIPRSService.verifyNationalID(idNumber);

    if (result.success && result.data) {
      setData(result.data);
      if (verifiedBy) {
        await mockIPRSService.recordVerification(idNumber, result.data.full_name, verifiedBy);
      }
    } else {
      setError(result.error || 'Verification failed');
    }

    setLoading(false);
    return result;
  };

  const reset = () => {
    setData(null);
    setError(null);
  };

  return { verifyID, loading, error, data, reset };
}

export function useECitizenPayment() {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);

  const initiatePayment = async (
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
  ) => {
    setLoading(true);
    setError(null);

    const result = await mockECitizenService.initiatePayment(
      serviceType,
      amount,
      paymentMethod,
      payerDetails
    );

    if (result.success && result.data) {
      setTransaction(result.data);
    } else {
      setError(result.error || 'Payment initiation failed');
    }

    setLoading(false);
    return result;
  };

  const processPayment = async (billReference: string) => {
    setProcessing(true);
    setError(null);

    const result = await mockECitizenService.processPayment(billReference);

    if (result.success && result.data) {
      setTransaction(result.data);
    } else {
      setError(result.error || 'Payment processing failed');
    }

    setProcessing(false);
    return result;
  };

  const checkStatus = async (billReference: string) => {
    const result = await mockECitizenService.getPaymentStatus(billReference);
    
    if (result.success && result.data) {
      setTransaction(result.data);
    }

    return result;
  };

  const reset = () => {
    setTransaction(null);
    setError(null);
  };

  return { 
    initiatePayment, 
    processPayment, 
    checkStatus,
    loading, 
    processing,
    error, 
    transaction,
    reset 
  };
}

export function useKRAVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<KRARecord | null>(null);

  const verifyPIN = async (kraPin: string, verifiedBy?: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    const result = await mockKRAService.verifyPIN(kraPin);

    if (result.success && result.data) {
      setData(result.data);
      if (verifiedBy) {
        await mockKRAService.recordVerification(
          kraPin, 
          result.data.compliance_status, 
          result.data.compliance_certificate_number,
          verifiedBy
        );
      }
    } else {
      setError(result.error || 'KRA verification failed');
    }

    setLoading(false);
    return result;
  };

  const reset = () => {
    setData(null);
    setError(null);
  };

  return { verifyPIN, loading, error, data, reset };
}

export function useSASRACompliance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SASRACompliance | null>(null);

  const checkLicense = async (cooperativeId: string, verifiedBy?: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    const result = await mockSASRAService.checkLicense(cooperativeId);

    if (result.success && result.data) {
      setData(result.data);
      if (verifiedBy) {
        await mockSASRAService.recordVerification(
          cooperativeId,
          result.data.license_number,
          result.data.license_status,
          result.data.license_expiry_date,
          verifiedBy
        );
      }
    } else {
      setError(result.error || 'SASRA compliance check failed');
    }

    setLoading(false);
    return result;
  };

  const reset = () => {
    setData(null);
    setError(null);
  };

  return { checkLicense, loading, error, data, reset };
}
