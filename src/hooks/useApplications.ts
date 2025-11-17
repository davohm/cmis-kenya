import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ApplicationStatus } from '../lib/supabase';

export interface Application {
  id: string;
  application_number: string;
  proposed_name: string;
  type_id: string;
  tenant_id: string;
  applicant_user_id: string | null;
  proposed_members: number;
  proposed_share_capital: number | null;
  primary_activity: string | null;
  operating_area: string | null;
  address: string | null;
  contact_person: string;
  contact_phone: string;
  contact_email: string | null;
  bylaws_url: string | null;
  member_list_url: string | null;
  minutes_url: string | null;
  id_copies_url: string | null;
  status: ApplicationStatus;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  cooperative_types?: {
    id: string;
    name: string;
    category: string;
  };
  tenants?: {
    id: string;
    name: string;
  };
}

export interface ApplicationFilters {
  status?: ApplicationStatus | 'ALL';
  countyId?: string;
  typeId?: string;
  search?: string;
}

export function useApplications(
  role: string,
  tenantId: string | undefined,
  filters: ApplicationFilters = {},
  page: number = 1,
  pageSize: number = 10
) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadApplications();
  }, [role, tenantId, filters.status, filters.countyId, filters.typeId, filters.search, page, pageSize]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query
      let query = supabase
        .from('registration_applications')
        .select(`
          *,
          cooperative_types(id, name, category),
          tenants(id, name)
        `, { count: 'exact' });

      // Role-based filtering
      if (role === 'COUNTY_ADMIN' && tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      // Status filter
      if (filters.status && filters.status !== 'ALL') {
        query = query.eq('status', filters.status);
      }

      // County filter (for Super Admin)
      if (filters.countyId) {
        query = query.eq('tenant_id', filters.countyId);
      }

      // Type filter
      if (filters.typeId) {
        query = query.eq('type_id', filters.typeId);
      }

      // Search filter
      if (filters.search) {
        query = query.or(`application_number.ilike.%${filters.search}%,proposed_name.ilike.%${filters.search}%`);
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

      setApplications(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error loading applications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    loadApplications();
  };

  return {
    applications,
    loading,
    error,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    refetch
  };
}
