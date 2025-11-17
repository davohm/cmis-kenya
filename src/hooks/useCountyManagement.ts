import { useEffect, useState } from 'react';
import { supabase, UserRole } from '../lib/supabase';

export interface County {
  id: string;
  name: string;
  type: string;
  county_code: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  stats?: {
    cooperatives: number;
    county_admins: number;
    county_officers: number;
    active_cooperatives: number;
    pending_applications: number;
  };
}

export interface CountyAdmin {
  id: string;
  user_id: string;
  role: UserRole;
  assigned_at: string;
  is_active: boolean;
  user: {
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
    id_number: string | null;
  };
}

export interface CountyDetails extends County {
  admins: CountyAdmin[];
  officers: CountyAdmin[];
  cooperatives: any[];
}

export interface UserSearchResult {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  id_number: string | null;
  tenant_id: string | null;
  existing_roles: Array<{
    role: UserRole;
    tenant_id: string;
    tenant_name: string;
  }>;
}

export function useCounties() {
  const [counties, setCounties] = useState<County[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCounties();
  }, []);

  const loadCounties = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: countiesData, error: countiesError } = await supabase
        .from('tenants')
        .select('*')
        .eq('type', 'COUNTY')
        .order('name');

      if (countiesError) throw countiesError;

      const countiesWithStats = await Promise.all(
        (countiesData || []).map(async (county) => {
          const { count: coopsCount } = await supabase
            .from('cooperatives')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', county.id);

          const { count: activeCoopsCount } = await supabase
            .from('cooperatives')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', county.id)
            .eq('is_active', true);

          const { count: pendingAppsCount } = await supabase
            .from('registration_applications')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', county.id)
            .in('status', ['SUBMITTED', 'UNDER_REVIEW']);

          const { count: adminsCount } = await supabase
            .from('user_roles')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', county.id)
            .eq('role', 'COUNTY_ADMIN')
            .eq('is_active', true);

          const { count: officersCount } = await supabase
            .from('user_roles')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', county.id)
            .eq('role', 'COUNTY_OFFICER')
            .eq('is_active', true);

          return {
            ...county,
            stats: {
              cooperatives: coopsCount || 0,
              county_admins: adminsCount || 0,
              county_officers: officersCount || 0,
              active_cooperatives: activeCoopsCount || 0,
              pending_applications: pendingAppsCount || 0
            }
          };
        })
      );

      setCounties(countiesWithStats);
    } catch (err) {
      console.error('Error loading counties:', err);
      setError(err instanceof Error ? err.message : 'Failed to load counties');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    loadCounties();
  };

  return { counties, loading, error, refetch };
}

export function useCountyDetails(countyId: string | null) {
  const [countyDetails, setCountyDetails] = useState<CountyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (countyId) {
      loadCountyDetails();
    } else {
      setCountyDetails(null);
      setLoading(false);
    }
  }, [countyId]);

  const loadCountyDetails = async () => {
    if (!countyId) return;

    try {
      setLoading(true);
      setError(null);

      const { data: county, error: countyError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', countyId)
        .single();

      if (countyError) throw countyError;

      const { data: adminsData, error: adminsError } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          assigned_at,
          is_active,
          users!user_roles_user_id_fkey(id, email, full_name, phone, id_number)
        `)
        .eq('tenant_id', countyId)
        .eq('role', 'COUNTY_ADMIN')
        .eq('is_active', true);

      if (adminsError) throw adminsError;

      const { data: officersData, error: officersError } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          assigned_at,
          is_active,
          users!user_roles_user_id_fkey(id, email, full_name, phone, id_number)
        `)
        .eq('tenant_id', countyId)
        .eq('role', 'COUNTY_OFFICER')
        .eq('is_active', true);

      if (officersError) throw officersError;

      const { data: cooperatives, error: coopsError } = await supabase
        .from('cooperatives')
        .select(`
          *,
          cooperative_types(id, name, category)
        `)
        .eq('tenant_id', countyId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (coopsError) throw coopsError;

      const { count: coopsCount } = await supabase
        .from('cooperatives')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', countyId);

      const { count: activeCoopsCount } = await supabase
        .from('cooperatives')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', countyId)
        .eq('is_active', true);

      const { count: pendingAppsCount } = await supabase
        .from('registration_applications')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', countyId)
        .in('status', ['SUBMITTED', 'UNDER_REVIEW']);

      setCountyDetails({
        ...county,
        stats: {
          cooperatives: coopsCount || 0,
          county_admins: adminsData?.length || 0,
          county_officers: officersData?.length || 0,
          active_cooperatives: activeCoopsCount || 0,
          pending_applications: pendingAppsCount || 0
        },
        admins: adminsData?.map(a => ({
          ...a,
          user: a.users as any
        })) || [],
        officers: officersData?.map(o => ({
          ...o,
          user: o.users as any
        })) || [],
        cooperatives: cooperatives || []
      });
    } catch (err) {
      console.error('Error loading county details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load county details');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    loadCountyDetails();
  };

  return { countyDetails, loading, error, refetch };
}

export function useAssignCountyRole() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignRole = async (
    userId: string,
    countyId: string,
    role: 'COUNTY_ADMIN' | 'COUNTY_OFFICER',
    assignedBy: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('tenant_id', countyId)
        .eq('role', role)
        .maybeSingle();

      if (existingRole) {
        if (existingRole.is_active) {
          throw new Error('User already has this role in this county');
        } else {
          const { error: updateError } = await supabase
            .from('user_roles')
            .update({ is_active: true, assigned_at: new Date().toISOString() })
            .eq('id', existingRole.id);

          if (updateError) throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            tenant_id: countyId,
            role,
            assigned_by: assignedBy,
            is_active: true
          });

        if (insertError) throw insertError;
      }

      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ tenant_id: countyId })
        .eq('id', userId);

      if (userUpdateError) throw userUpdateError;

      return { success: true };
    } catch (err) {
      console.error('Error assigning role:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign role';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { assignRole, loading, error };
}

export function useRemoveCountyRole() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeRole = async (roleId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('id', roleId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (err) {
      console.error('Error removing role:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove role';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { removeRole, loading, error };
}

export function useSearchUsers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = async (searchTerm: string): Promise<UserSearchResult[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, phone, id_number, tenant_id')
        .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .limit(10);

      if (usersError) throw usersError;

      const usersWithRoles = await Promise.all(
        (users || []).map(async (user) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role, tenant_id, tenants(name)')
            .eq('user_id', user.id)
            .eq('is_active', true);

          return {
            ...user,
            existing_roles: roles?.map(r => ({
              role: r.role as UserRole,
              tenant_id: r.tenant_id,
              tenant_name: (r.tenants as any)?.name || ''
            })) || []
          };
        })
      );

      return usersWithRoles;
    } catch (err) {
      console.error('Error searching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to search users');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { searchUsers, loading, error };
}

export function useCreateUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = async (userData: {
    email: string;
    full_name: string;
    phone: string;
    id_number: string;
    county_id: string;
    role: 'COUNTY_ADMIN' | 'COUNTY_OFFICER' | 'CITIZEN';
    assigned_by: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const tempPassword = `Coop${Math.random().toString(36).slice(-8)}!`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: tempPassword,
        options: {
          data: {
            full_name: userData.full_name
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          phone: userData.phone,
          id_number: userData.id_number,
          tenant_id: userData.county_id
        });

      if (userError) throw userError;

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          tenant_id: userData.county_id,
          role: userData.role,
          assigned_by: userData.assigned_by,
          is_active: true
        });

      if (roleError) throw roleError;

      return { 
        success: true, 
        userId: authData.user.id,
        tempPassword 
      };
    } catch (err) {
      console.error('Error creating user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { createUser, loading, error };
}
