import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  id_number: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  tenants?: {
    id: string;
    name: string;
  };
  user_roles?: Array<{
    id: string;
    role: string;
    tenant_id: string;
    is_active: boolean;
    assigned_at: string;
    assigned_by: string;
    tenants?: {
      id: string;
      name: string;
    };
  }>;
}

export interface UserFilters {
  role?: string;
  tenant_id?: string;
  search?: string;
  is_active?: boolean;
}

export interface CreateUserData {
  email: string;
  full_name: string;
  phone: string;
  id_number: string;
  tenant_id: string;
  role: string;
}

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const loadUsers = useCallback(async (
    filters: UserFilters = {},
    page: number = 1,
    pageSize: number = 20
  ) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('users')
        .select(`
          *,
          tenants(id, name),
          user_roles(
            id,
            role,
            tenant_id,
            is_active,
            assigned_at,
            assigned_by,
            tenants(id, name)
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.tenant_id) {
        query = query.eq('tenant_id', filters.tenant_id);
      }
      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,id_number.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      // Filter by role if specified
      let filteredData = data || [];
      if (filters.role) {
        filteredData = filteredData.filter(user => 
          user.user_roles?.some(ur => ur.role === filters.role && ur.is_active)
        );
      }

      setUsers(filteredData);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (userData: CreateUserData): Promise<{ userId: string; tempPassword: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      const tempPassword = `Coop${Math.random().toString(36).slice(-8)}!`;

      // Create auth user
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

      // Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          phone: userData.phone,
          id_number: userData.id_number,
          tenant_id: userData.tenant_id
        });

      if (userError) throw userError;

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          tenant_id: userData.tenant_id,
          role: userData.role,
          assigned_by: currentUser.id,
          is_active: true
        });

      if (roleError) throw roleError;

      return {
        userId: authData.user.id,
        tempPassword
      };
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (
    userId: string,
    updates: Partial<CreateUserData>
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deactivateUser = useCallback(async (userId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Deactivate all user roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (roleError) throw roleError;
    } catch (err) {
      console.error('Error deactivating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to deactivate user');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignRole = useCallback(async (
    userId: string,
    role: string,
    tenantId: string
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      // Check if role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .eq('role', role)
        .maybeSingle();

      if (existingRole) {
        // Reactivate if exists
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ is_active: true, assigned_at: new Date().toISOString() })
          .eq('id', existingRole.id);

        if (updateError) throw updateError;
      } else {
        // Create new role
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            tenant_id: tenantId,
            role,
            assigned_by: currentUser.id,
            is_active: true
          });

        if (insertError) throw insertError;
      }
    } catch (err) {
      console.error('Error assigning role:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeRole = useCallback(async (roleId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('id', roleId);

      if (deleteError) throw deleteError;
    } catch (err) {
      console.error('Error removing role:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    users,
    loading,
    error,
    totalCount,
    loadUsers,
    createUser,
    updateUser,
    deactivateUser,
    assignRole,
    removeRole,
  };
}

