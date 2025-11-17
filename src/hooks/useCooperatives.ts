import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CooperativeStatus } from '../lib/supabase';

export interface Cooperative {
  id: string;
  registration_number: string | null;
  name: string;
  type_id: string | null;
  tenant_id: string;
  status: CooperativeStatus;
  registration_date: string | null;
  address: string | null;
  postal_address: string | null;
  email: string | null;
  phone: string | null;
  total_members: number;
  total_share_capital: number;
  bylaws_document_url: string | null;
  certificate_url: string | null;
  is_active: boolean;
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

export interface CooperativeFilters {
  status?: CooperativeStatus | 'ALL';
  countyId?: string;
  typeId?: string;
  search?: string;
}

export function useCooperatives(
  role: string,
  tenantId: string | undefined,
  cooperativeId?: string | undefined,
  filters: CooperativeFilters = {},
  page: number = 1,
  pageSize: number = 15
) {
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadCooperatives();
  }, [role, tenantId, cooperativeId, filters.status, filters.countyId, filters.typeId, filters.search, page, pageSize]);

  const loadCooperatives = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('cooperatives')
        .select(`
          *,
          cooperative_types(id, name, category),
          tenants(id, name)
        `, { count: 'exact' });

      // Role-based filtering
      if (role === 'COUNTY_ADMIN' && tenantId) {
        query = query.eq('tenant_id', tenantId);
      } else if (role === 'COOPERATIVE_ADMIN' && cooperativeId) {
        query = query.eq('id', cooperativeId);
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
        query = query.or(`registration_number.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Order by created_at desc
      query = query.order('created_at', { ascending: false });

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setCooperatives(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error loading cooperatives:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cooperatives');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    loadCooperatives();
  };

  return {
    cooperatives,
    loading,
    error,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    refetch
  };
}

export async function fetchCooperativeById(id: string): Promise<Cooperative | null> {
  try {
    const { data, error } = await supabase
      .from('cooperatives')
      .select(`
        *,
        cooperative_types(id, name, category),
        tenants(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching cooperative:', err);
    return null;
  }
}
