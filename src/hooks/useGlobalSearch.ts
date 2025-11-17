import { useState, useEffect, useCallback } from 'react';
import { supabase, UserRole } from '../lib/supabase';

export interface SearchResult {
  id: string;
  type: 'cooperative' | 'application' | 'user' | 'complaint' | 'amendment' | 'auditor' | 'trainer' | 'official_search';
  title: string;
  subtitle: string;
  metadata: Record<string, any>;
  navigateTo: string;
}

export interface CategorizedResults {
  cooperatives: SearchResult[];
  applications: SearchResult[];
  users: SearchResult[];
  complaints: SearchResult[];
  amendments: SearchResult[];
  auditors: SearchResult[];
  trainers: SearchResult[];
  official_searches: SearchResult[];
}

export interface UseGlobalSearchParams {
  query: string;
  role: UserRole;
  tenantId?: string;
  cooperativeId?: string;
  userId?: string;
  maxPerCategory?: number;
}

export function useGlobalSearch({
  query,
  role,
  tenantId,
  cooperativeId,
  userId,
  maxPerCategory = 5
}: UseGlobalSearchParams) {
  const [results, setResults] = useState<CategorizedResults>({
    cooperatives: [],
    applications: [],
    users: [],
    complaints: [],
    amendments: [],
    auditors: [],
    trainers: [],
    official_searches: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCooperatives = async (searchQuery: string): Promise<SearchResult[]> => {
    try {
      let query = supabase
        .from('cooperatives')
        .select(`
          id,
          name,
          registration_number,
          status,
          tenants(name),
          cooperative_types(name)
        `)
        .or(`name.ilike.%${searchQuery}%,registration_number.ilike.%${searchQuery}%`)
        .limit(maxPerCategory);

      if (role === 'COUNTY_ADMIN' || role === 'COUNTY_OFFICER') {
        if (tenantId) query = query.eq('tenant_id', tenantId);
      } else if (role === 'COOPERATIVE_ADMIN') {
        if (cooperativeId) query = query.eq('id', cooperativeId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(coop => ({
        id: coop.id,
        type: 'cooperative' as const,
        title: coop.name,
        subtitle: `${coop.registration_number || 'N/A'} • ${(coop.tenants as any)?.name || 'N/A'}`,
        metadata: {
          status: coop.status,
          type: (coop.cooperative_types as any)?.name,
          county: (coop.tenants as any)?.name
        },
        navigateTo: `/cooperatives/${coop.id}`
      }));
    } catch (err) {
      console.error('Error searching cooperatives:', err);
      return [];
    }
  };

  const searchApplications = async (searchQuery: string): Promise<SearchResult[]> => {
    try {
      if (role === 'CITIZEN' || role === 'AUDITOR' || role === 'TRAINER') return [];

      let query = supabase
        .from('registration_applications')
        .select(`
          id,
          application_number,
          proposed_name,
          status,
          submitted_at,
          tenants(name)
        `)
        .or(`proposed_name.ilike.%${searchQuery}%,application_number.ilike.%${searchQuery}%`)
        .limit(maxPerCategory);

      if (role === 'COUNTY_ADMIN' || role === 'COUNTY_OFFICER') {
        if (tenantId) query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(app => ({
        id: app.id,
        type: 'application' as const,
        title: app.proposed_name,
        subtitle: `${app.application_number} • ${app.status}`,
        metadata: {
          status: app.status,
          submittedAt: app.submitted_at,
          county: (app.tenants as any)?.name
        },
        navigateTo: `/applications/${app.id}`
      }));
    } catch (err) {
      console.error('Error searching applications:', err);
      return [];
    }
  };

  const searchUsers = async (searchQuery: string): Promise<SearchResult[]> => {
    try {
      if (role === 'CITIZEN' || role === 'COOPERATIVE_ADMIN' || role === 'AUDITOR' || role === 'TRAINER') return [];

      let query = supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          phone,
          id_number,
          tenants(name),
          user_roles(role)
        `)
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,id_number.ilike.%${searchQuery}%`)
        .limit(maxPerCategory);

      if (role === 'COUNTY_ADMIN' || role === 'COUNTY_OFFICER') {
        if (tenantId) query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(user => {
        const userRoles = user.user_roles as any[];
        const primaryRole = userRoles && userRoles.length > 0 ? userRoles[0].role : 'N/A';
        
        return {
          id: user.id,
          type: 'user' as const,
          title: user.full_name,
          subtitle: `${user.email} • ${primaryRole}`,
          metadata: {
            email: user.email,
            phone: user.phone,
            role: primaryRole,
            county: (user.tenants as any)?.name
          },
          navigateTo: `/users/${user.id}`
        };
      });
    } catch (err) {
      console.error('Error searching users:', err);
      return [];
    }
  };

  const searchComplaints = async (searchQuery: string): Promise<SearchResult[]> => {
    try {
      if (role === 'CITIZEN' || role === 'AUDITOR' || role === 'TRAINER') return [];

      let query = supabase
        .from('inquiry_requests')
        .select(`
          id,
          inquiry_number,
          subject,
          complaint_category,
          complaint_status,
          cooperatives(id, name, tenant_id)
        `)
        .not('complaint_category', 'is', null)
        .or(`inquiry_number.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%`)
        .limit(maxPerCategory);

      if (role === 'COUNTY_ADMIN' || role === 'COUNTY_OFFICER') {
        const { data: coopIds } = await supabase
          .from('cooperatives')
          .select('id')
          .eq('tenant_id', tenantId);
        
        if (coopIds && coopIds.length > 0) {
          query = query.in('cooperative_id', coopIds.map(c => c.id));
        } else {
          return [];
        }
      } else if (role === 'COOPERATIVE_ADMIN' && cooperativeId) {
        query = query.eq('cooperative_id', cooperativeId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(complaint => ({
        id: complaint.id,
        type: 'complaint' as const,
        title: complaint.subject,
        subtitle: `${complaint.inquiry_number} • ${complaint.complaint_status}`,
        metadata: {
          complaintNumber: complaint.inquiry_number,
          category: complaint.complaint_category,
          status: complaint.complaint_status,
          cooperative: (complaint.cooperatives as any)?.name
        },
        navigateTo: `/complaints/${complaint.id}`
      }));
    } catch (err) {
      console.error('Error searching complaints:', err);
      return [];
    }
  };

  const searchAmendments = async (searchQuery: string): Promise<SearchResult[]> => {
    try {
      if (role === 'CITIZEN' || role === 'AUDITOR' || role === 'TRAINER') return [];

      let query = supabase
        .from('amendment_requests')
        .select(`
          id,
          request_number,
          amendment_type,
          status,
          cooperatives(id, name, tenant_id)
        `)
        .or(`request_number.ilike.%${searchQuery}%`)
        .limit(maxPerCategory);

      if (role === 'COUNTY_ADMIN' || role === 'COUNTY_OFFICER') {
        const { data: coopIds } = await supabase
          .from('cooperatives')
          .select('id')
          .eq('tenant_id', tenantId);
        
        if (coopIds && coopIds.length > 0) {
          query = query.in('cooperative_id', coopIds.map(c => c.id));
        } else {
          return [];
        }
      } else if (role === 'COOPERATIVE_ADMIN' && cooperativeId) {
        query = query.eq('cooperative_id', cooperativeId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(amendment => ({
        id: amendment.id,
        type: 'amendment' as const,
        title: `${amendment.amendment_type.replace('_', ' ')} - ${(amendment.cooperatives as any)?.name || 'N/A'}`,
        subtitle: `${amendment.request_number} • ${amendment.status}`,
        metadata: {
          amendmentNumber: amendment.request_number,
          type: amendment.amendment_type,
          status: amendment.status,
          cooperative: (amendment.cooperatives as any)?.name
        },
        navigateTo: `/amendments/${amendment.id}`
      }));
    } catch (err) {
      console.error('Error searching amendments:', err);
      return [];
    }
  };

  const searchAuditors = async (searchQuery: string): Promise<SearchResult[]> => {
    try {
      const { data, error } = await supabase
        .from('auditor_profiles')
        .select(`
          id,
          user_id,
          full_name,
          qualification,
          certification_body,
          specializations
        `)
        .eq('is_active', true)
        .or(`full_name.ilike.%${searchQuery}%,certification_body.ilike.%${searchQuery}%`)
        .limit(maxPerCategory);

      if (error) throw error;

      return (data || []).map(auditor => ({
        id: auditor.id,
        type: 'auditor' as const,
        title: auditor.full_name,
        subtitle: `${auditor.qualification} • ${auditor.certification_body}`,
        metadata: {
          qualification: auditor.qualification,
          certificationBody: auditor.certification_body,
          specializations: auditor.specializations
        },
        navigateTo: `/auditors/${auditor.user_id}`
      }));
    } catch (err) {
      console.error('Error searching auditors:', err);
      return [];
    }
  };

  const searchTrainers = async (searchQuery: string): Promise<SearchResult[]> => {
    try {
      const { data, error } = await supabase
        .from('trainer_profiles')
        .select(`
          id,
          user_id,
          full_name,
          education_level,
          institution,
          specializations
        `)
        .eq('is_active', true)
        .or(`full_name.ilike.%${searchQuery}%,institution.ilike.%${searchQuery}%`)
        .limit(maxPerCategory);

      if (error) throw error;

      return (data || []).map(trainer => ({
        id: trainer.id,
        type: 'trainer' as const,
        title: trainer.full_name,
        subtitle: `${trainer.education_level} • ${trainer.institution}`,
        metadata: {
          educationLevel: trainer.education_level,
          institution: trainer.institution,
          specializations: trainer.specializations
        },
        navigateTo: `/trainers/${trainer.user_id}`
      }));
    } catch (err) {
      console.error('Error searching trainers:', err);
      return [];
    }
  };

  const searchOfficialSearches = async (searchQuery: string): Promise<SearchResult[]> => {
    try {
      if (role === 'COOPERATIVE_ADMIN') return [];

      let query = supabase
        .from('search_requests')
        .select(`
          id,
          search_number,
          requester_name,
          payment_status,
          created_at,
          cooperatives(name)
        `)
        .or(`search_number.ilike.%${searchQuery}%,requester_name.ilike.%${searchQuery}%`)
        .limit(maxPerCategory);

      if (role === 'CITIZEN' && userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(search => ({
        id: search.id,
        type: 'official_search' as const,
        title: `Search: ${(search.cooperatives as any)?.name || 'N/A'}`,
        subtitle: `${search.search_number} • ${search.requester_name || 'Anonymous'}`,
        metadata: {
          searchNumber: search.search_number,
          requesterName: search.requester_name,
          paymentStatus: search.payment_status,
          cooperative: (search.cooperatives as any)?.name,
          createdAt: search.created_at
        },
        navigateTo: `/official-searches/${search.id}`
      }));
    } catch (err) {
      console.error('Error searching official searches:', err);
      return [];
    }
  };

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults({
        cooperatives: [],
        applications: [],
        users: [],
        complaints: [],
        amendments: [],
        auditors: [],
        trainers: [],
        official_searches: []
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        cooperatives,
        applications,
        users,
        complaints,
        amendments,
        auditors,
        trainers,
        official_searches
      ] = await Promise.all([
        searchCooperatives(searchQuery),
        searchApplications(searchQuery),
        searchUsers(searchQuery),
        searchComplaints(searchQuery),
        searchAmendments(searchQuery),
        searchAuditors(searchQuery),
        searchTrainers(searchQuery),
        searchOfficialSearches(searchQuery)
      ]);

      setResults({
        cooperatives,
        applications,
        users,
        complaints,
        amendments,
        auditors,
        trainers,
        official_searches
      });
    } catch (err) {
      console.error('Global search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [role, tenantId, cooperativeId, userId, maxPerCategory]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      performSearch(query);
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [query, performSearch]);

  const totalResults = 
    results.cooperatives.length +
    results.applications.length +
    results.users.length +
    results.complaints.length +
    results.amendments.length +
    results.auditors.length +
    results.trainers.length +
    results.official_searches.length;

  return {
    results,
    loading,
    error,
    totalResults
  };
}
