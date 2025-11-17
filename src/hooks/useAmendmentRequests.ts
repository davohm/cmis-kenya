import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type AmendmentType = 
  | 'BYLAW_AMENDMENT'
  | 'NAME_CHANGE'
  | 'ADDRESS_CHANGE'
  | 'OFFICIAL_CHANGE'
  | 'MEMBERSHIP_RULES'
  | 'SHARE_CAPITAL_CHANGE'
  | 'OTHER';

export type AmendmentStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ADDITIONAL_INFO_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface AmendmentRequest {
  id: string;
  request_number: string;
  cooperative_id: string;
  amendment_type: AmendmentType;
  current_value: string | null;
  proposed_value: string | null;
  reason: string;
  supporting_documents_url: string | null;
  resolution_minutes_url: string | null;
  status: AmendmentStatus;
  submitted_by: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  effective_date: string | null;
  created_at: string;
  updated_at: string;
  cooperatives?: {
    id: string;
    name: string;
    registration_number: string;
  };
}

export interface AmendmentFilters {
  status?: AmendmentStatus | 'ALL';
  amendmentType?: AmendmentType | 'ALL';
  cooperativeId?: string;
  search?: string;
}

export function useAmendmentRequests(
  role: string,
  tenantId: string | undefined,
  cooperativeId: string | undefined,
  filters: AmendmentFilters = {},
  page: number = 1,
  pageSize: number = 10
) {
  const [amendments, setAmendments] = useState<AmendmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadAmendments();
  }, [role, tenantId, cooperativeId, filters.status, filters.amendmentType, filters.cooperativeId, filters.search, page, pageSize]);

  const loadAmendments = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('amendment_requests')
        .select(`
          *,
          cooperatives(id, name, registration_number, tenant_id)
        `, { count: 'exact' });

      // Role-based filtering
      if (role === 'COOPERATIVE_ADMIN' && cooperativeId) {
        query = query.eq('cooperative_id', cooperativeId);
      } else if (role === 'COUNTY_ADMIN' && tenantId) {
        // Get cooperatives in this county
        const { data: coopIds } = await supabase
          .from('cooperatives')
          .select('id')
          .eq('tenant_id', tenantId);
        
        if (coopIds && coopIds.length > 0) {
          query = query.in('cooperative_id', coopIds.map(c => c.id));
        } else {
          setAmendments([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }
      }

      // Status filter
      if (filters.status && filters.status !== 'ALL') {
        query = query.eq('status', filters.status);
      }

      // Amendment type filter
      if (filters.amendmentType && filters.amendmentType !== 'ALL') {
        query = query.eq('amendment_type', filters.amendmentType);
      }

      // Specific cooperative filter
      if (filters.cooperativeId) {
        query = query.eq('cooperative_id', filters.cooperativeId);
      }

      // Search filter
      if (filters.search) {
        query = query.or(`request_number.ilike.%${filters.search}%`);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Order by submitted_at desc, then created_at desc
      query = query.order('submitted_at', { ascending: false, nullsFirst: false })
                   .order('created_at', { ascending: false });

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setAmendments(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error loading amendments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load amendments');
    } finally {
      setLoading(false);
    }
  };

  const submitAmendment = async (amendmentData: {
    cooperative_id: string;
    amendment_type: AmendmentType;
    current_value: string;
    proposed_value: string;
    reason: string;
    supporting_documents_url?: string;
    resolution_minutes_url?: string;
    submitted_by: string;
  }) => {
    try {
      const requestNumber = `AMD-${Date.now().toString().slice(-8)}`;
      
      const { data, error } = await supabase
        .from('amendment_requests')
        .insert({
          request_number: requestNumber,
          cooperative_id: amendmentData.cooperative_id,
          amendment_type: amendmentData.amendment_type,
          current_value: amendmentData.current_value,
          proposed_value: amendmentData.proposed_value,
          reason: amendmentData.reason,
          supporting_documents_url: amendmentData.supporting_documents_url || null,
          resolution_minutes_url: amendmentData.resolution_minutes_url || null,
          status: 'SUBMITTED',
          submitted_by: amendmentData.submitted_by,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await loadAmendments();
      return { success: true, data };
    } catch (err) {
      console.error('Error submitting amendment:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to submit amendment' 
      };
    }
  };

  const approveAmendment = async (amendmentId: string, reviewedBy: string, reviewNotes?: string) => {
    try {
      const { error } = await supabase
        .from('amendment_requests')
        .update({
          status: 'APPROVED',
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          approved_by: reviewedBy,
          approved_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
          effective_date: new Date().toISOString()
        })
        .eq('id', amendmentId);

      if (error) throw error;

      await loadAmendments();
      return { success: true };
    } catch (err) {
      console.error('Error approving amendment:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to approve amendment' 
      };
    }
  };

  const rejectAmendment = async (amendmentId: string, reviewedBy: string, reviewNotes: string) => {
    try {
      const { error } = await supabase
        .from('amendment_requests')
        .update({
          status: 'REJECTED',
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes
        })
        .eq('id', amendmentId);

      if (error) throw error;

      await loadAmendments();
      return { success: true };
    } catch (err) {
      console.error('Error rejecting amendment:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to reject amendment' 
      };
    }
  };

  const refetch = () => {
    loadAmendments();
  };

  return {
    amendments,
    loading,
    error,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    submitAmendment,
    approveAmendment,
    rejectAmendment,
    refetch
  };
}
