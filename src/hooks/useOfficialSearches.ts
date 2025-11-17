import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';
import { Cooperative } from './useCooperatives';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type PaymentMethod = 'MPESA' | 'CARD' | 'CASH';

export interface SearchRequest {
  id: string;
  search_number: string;
  user_id: string | null;
  cooperative_id: string;
  requester_name: string | null;
  requester_id_number: string | null;
  requester_email: string | null;
  requester_phone: string | null;
  purpose: string | null;
  certificate_generated: boolean;
  certificate_number: string | null;
  certificate_url: string | null;
  payment_reference: string | null;
  payment_amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  created_at: string;
  updated_at: string;
  cooperative?: Cooperative;
}

export interface SearchFilters {
  cooperativeName?: string;
  registrationNumber?: string;
  countyId?: string;
  typeId?: string;
  status?: string;
  registrationDateFrom?: string;
  registrationDateTo?: string;
}

export interface CertificateRequestData {
  cooperative_id: string;
  requester_name: string;
  requester_id_number: string;
  requester_email: string;
  requester_phone: string;
  purpose: string;
  payment_method: PaymentMethod;
}

export function useOfficialSearches() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCooperatives = async (
    filters: SearchFilters,
    page: number = 1,
    pageSize: number = 10
  ) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('cooperatives')
        .select(`
          *,
          cooperative_types(id, name, category),
          tenants(id, name)
        `, { count: 'exact' })
        .eq('is_active', true);

      if (filters.cooperativeName) {
        query = query.ilike('name', `%${filters.cooperativeName}%`);
      }

      if (filters.registrationNumber) {
        query = query.ilike('registration_number', `%${filters.registrationNumber}%`);
      }

      if (filters.countyId) {
        query = query.eq('tenant_id', filters.countyId);
      }

      if (filters.typeId) {
        query = query.eq('type_id', filters.typeId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.registrationDateFrom) {
        query = query.gte('registration_date', filters.registrationDateFrom);
      }

      if (filters.registrationDateTo) {
        query = query.lte('registration_date', filters.registrationDateTo);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error: fetchError, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchError) throw fetchError;

      return {
        cooperatives: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    } catch (err) {
      console.error('Error searching cooperatives:', err);
      setError(err instanceof Error ? err.message : 'Failed to search cooperatives');
      return { cooperatives: [], totalCount: 0, totalPages: 0 };
    } finally {
      setLoading(false);
    }
  };

  const recordSearchRequest = async (cooperativeId: string, userId?: string) => {
    try {
      const { data, error: insertError } = await supabase
        .from('search_requests')
        .insert({
          cooperative_id: cooperativeId,
          user_id: userId || null,
          payment_status: 'PENDING'
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (err) {
      console.error('Error recording search request:', err);
      throw err;
    }
  };

  const createCertificateRequest = async (
    requestData: CertificateRequestData,
    userId?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const paymentRef = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { data, error: insertError } = await supabase
        .from('search_requests')
        .insert({
          cooperative_id: requestData.cooperative_id,
          user_id: userId || null,
          requester_name: requestData.requester_name,
          requester_id_number: requestData.requester_id_number,
          requester_email: requestData.requester_email,
          requester_phone: requestData.requester_phone,
          purpose: requestData.purpose,
          payment_method: requestData.payment_method,
          payment_reference: paymentRef,
          payment_status: 'COMPLETED',
          payment_amount: 500.00
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (err) {
      console.error('Error creating certificate request:', err);
      setError(err instanceof Error ? err.message : 'Failed to create certificate request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async (searchRequest: SearchRequest, cooperative: Cooperative) => {
    try {
      setLoading(true);

      const certNumber = `CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      pdf.setDrawColor(0);
      pdf.setLineWidth(0.5);
      pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);
      pdf.rect(12, 12, pageWidth - 24, pageHeight - 24);

      pdf.setFillColor(139, 0, 0);
      pdf.rect(0, 0, pageWidth, 40, 'F');

      pdf.setFillColor(0, 100, 0);
      pdf.rect(0, 40, pageWidth, 5, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REPUBLIC OF KENYA', pageWidth / 2, 20, { align: 'center' });

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text('STATE DEPARTMENT FOR COOPERATIVES', pageWidth / 2, 30, { align: 'center' });

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('OFFICIAL SEARCH CERTIFICATE', pageWidth / 2, 60, { align: 'center' });

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      let yPos = 75;

      pdf.setFontSize(10);
      pdf.text(`Certificate No: ${certNumber}`, margin, yPos);
      pdf.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin - 40, yPos);
      yPos += 10;

      pdf.setDrawColor(200);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 15;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('COOPERATIVE INFORMATION', margin, yPos);
      yPos += 10;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);

      const details = [
        { label: 'Name:', value: cooperative.name },
        { label: 'Registration Number:', value: cooperative.registration_number || 'N/A' },
        { label: 'Type:', value: cooperative.cooperative_types?.name || 'N/A' },
        { label: 'County:', value: cooperative.tenants?.name || 'N/A' },
        { label: 'Status:', value: cooperative.status },
        { label: 'Registration Date:', value: cooperative.registration_date ? new Date(cooperative.registration_date).toLocaleDateString('en-GB') : 'N/A' },
        { label: 'Total Members:', value: cooperative.total_members.toString() },
        { label: 'Share Capital:', value: `KES ${cooperative.total_share_capital.toLocaleString()}` },
        { label: 'Registered Office:', value: cooperative.address || 'N/A' },
        { label: 'Contact Email:', value: cooperative.email || 'N/A' },
        { label: 'Contact Phone:', value: cooperative.phone || 'N/A' }
      ];

      details.forEach(item => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(item.label, margin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(item.value, margin + 50, yPos);
        yPos += 7;
      });

      yPos += 5;
      pdf.setDrawColor(200);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 15;

      if (searchRequest.requester_name) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('REQUESTER INFORMATION', margin, yPos);
        yPos += 10;

        pdf.setFont('helvetica', 'normal');
        const requesterDetails = [
          { label: 'Name:', value: searchRequest.requester_name },
          { label: 'ID Number:', value: searchRequest.requester_id_number || 'N/A' },
          { label: 'Email:', value: searchRequest.requester_email || 'N/A' },
          { label: 'Phone:', value: searchRequest.requester_phone || 'N/A' },
          { label: 'Purpose:', value: searchRequest.purpose || 'N/A' }
        ];

        requesterDetails.forEach(item => {
          pdf.setFont('helvetica', 'bold');
          pdf.text(item.label, margin, yPos);
          pdf.setFont('helvetica', 'normal');
          pdf.text(item.value, margin + 30, yPos);
          yPos += 7;
        });

        yPos += 5;
        pdf.setDrawColor(200);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 15;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.text('CERTIFICATION', margin, yPos);
      yPos += 10;

      pdf.setFont('helvetica', 'normal');
      const certText = `This is to certify that the above information has been extracted from the official records of the State Department for Cooperatives, Republic of Kenya, as of ${new Date().toLocaleDateString('en-GB')}.`;
      const splitText = pdf.splitTextToSize(certText, pageWidth - 2 * margin);
      pdf.text(splitText, margin, yPos);
      yPos += splitText.length * 7 + 10;

      pdf.setFontSize(8);
      pdf.text(`Search Reference: ${searchRequest.search_number}`, margin, yPos);
      pdf.text(`Payment Reference: ${searchRequest.payment_reference}`, margin, yPos + 5);

      const qrData = `CERT:${certNumber}:${cooperative.registration_number}`;
      pdf.setFontSize(8);
      pdf.text('Scan to verify:', pageWidth - margin - 40, pageHeight - 40);
      pdf.text(qrData, pageWidth - margin - 40, pageHeight - 35, { maxWidth: 40 });

      yPos = pageHeight - 35;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.text('_________________________', margin, yPos);
      pdf.text('Authorized Signature', margin, yPos + 5);

      pdf.setFontSize(7);
      pdf.setTextColor(100);
      pdf.text('This is an electronically generated certificate. For verification, visit www.cmis.go.ke/verify', pageWidth / 2, pageHeight - 15, { align: 'center' });
      pdf.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

      const fileName = `Certificate_${certNumber}_${cooperative.registration_number}.pdf`;

      const { error: updateError } = await supabase
        .from('search_requests')
        .update({
          certificate_generated: true,
          certificate_number: certNumber
        })
        .eq('id', searchRequest.id);

      if (updateError) throw updateError;

      pdf.save(fileName);

      return { success: true, certificateNumber: certNumber, fileName };
    } catch (err) {
      console.error('Error generating certificate:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate certificate');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    searchCooperatives,
    recordSearchRequest,
    createCertificateRequest,
    generateCertificate
  };
}

export function useSearchHistory(userId?: string) {
  const [history, setHistory] = useState<SearchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadHistory();
    }
  }, [userId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('search_requests')
        .select(`
          *,
          cooperative:cooperatives(
            *,
            cooperative_types(id, name, category)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setHistory(data || []);
    } catch (err) {
      console.error('Error loading search history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load search history');
    } finally {
      setLoading(false);
    }
  };

  return { history, loading, error, refresh: loadHistory };
}

export function exportToCSV(cooperatives: Cooperative[], fileName: string = 'cooperatives_search_results.csv') {
  const headers = [
    'Name',
    'Registration Number',
    'Type',
    'County',
    'Status',
    'Registration Date',
    'Total Members',
    'Share Capital',
    'Address',
    'Email',
    'Phone'
  ];

  const rows = cooperatives.map(coop => [
    coop.name,
    coop.registration_number || '',
    coop.cooperative_types?.name || '',
    coop.tenants?.name || '',
    coop.status,
    coop.registration_date ? new Date(coop.registration_date).toLocaleDateString() : '',
    coop.total_members.toString(),
    coop.total_share_capital.toString(),
    coop.address || '',
    coop.email || '',
    coop.phone || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
