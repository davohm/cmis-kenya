import { useState } from 'react';
import { supabase } from '../lib/supabase';

export interface CooperativeType {
  id: string;
  name: string;
  category: string;
  description: string | null;
}

export interface Tenant {
  id: string;
  name: string;
  county_code: string;
}

export interface CreateCooperativeData {
  name: string;
  registration_number: string;
  type_id: string;
  tenant_id: string;
  registration_date: string;
  address: string;
  postal_address?: string;
  email: string;
  phone: string;
  total_members?: number;
  total_share_capital?: number;
}

export interface UpdateCooperativeData {
  name?: string;
  registration_number?: string;
  type_id?: string;
  tenant_id?: string;
  registration_date?: string;
  address?: string;
  postal_address?: string;
  email?: string;
  phone?: string;
  total_members?: number;
  total_share_capital?: number;
}

export function useCooperativeCRUD() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCooperativeTypes = async (): Promise<CooperativeType[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('cooperative_types')
        .select('*')
        .order('name');

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error loading cooperative types:', err);
      return [];
    }
  };

  const loadCounties = async (): Promise<Tenant[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('tenants')
        .select('id, name, county_code')
        .eq('type', 'COUNTY')
        .eq('is_active', true)
        .order('name');

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error loading counties:', err);
      return [];
    }
  };

  const generateRegistrationNumber = async (countyId: string): Promise<string> => {
    try {
      const { data: county } = await supabase
        .from('tenants')
        .select('county_code')
        .eq('id', countyId)
        .single();

      if (!county) throw new Error('County not found');

      const currentYear = new Date().getFullYear();
      const countyCode = county.county_code || 'XXX';

      const { count } = await supabase
        .from('cooperatives')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', countyId)
        .like('registration_number', `COOP/${countyCode}/${currentYear}/%`);

      const sequenceNumber = String((count || 0) + 1).padStart(4, '0');
      return `COOP/${countyCode}/${currentYear}/${sequenceNumber}`;
    } catch (err) {
      console.error('Error generating registration number:', err);
      throw new Error('Failed to generate registration number');
    }
  };

  const createCooperative = async (data: CreateCooperativeData) => {
    try {
      setLoading(true);
      setError(null);

      const { data: existingCoop } = await supabase
        .from('cooperatives')
        .select('*')
        .eq('registration_number', data.registration_number)
        .maybeSingle();

      if (existingCoop) {
        throw new Error('A cooperative with this registration number already exists');
      }

      const { data: newCooperative, error: insertError } = await supabase
        .from('cooperatives')
        .insert({
          name: data.name,
          registration_number: data.registration_number,
          type_id: data.type_id,
          tenant_id: data.tenant_id,
          registration_date: data.registration_date,
          address: data.address,
          postal_address: data.postal_address || null,
          email: data.email,
          phone: data.phone,
          total_members: data.total_members || 0,
          total_share_capital: data.total_share_capital || 0,
          status: 'REGISTERED',
          is_active: true
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { success: true, data: newCooperative };
    } catch (err) {
      console.error('Error creating cooperative:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create cooperative';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateCooperative = async (id: string, data: UpdateCooperativeData) => {
    try {
      setLoading(true);
      setError(null);

      if (data.registration_number) {
        const { data: existingCoop } = await supabase
          .from('cooperatives')
          .select('*')
          .eq('registration_number', data.registration_number)
          .neq('id', id)
          .maybeSingle();

        if (existingCoop) {
          throw new Error('A cooperative with this registration number already exists');
        }
      }

      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.registration_number) updateData.registration_number = data.registration_number;
      if (data.type_id) updateData.type_id = data.type_id;
      if (data.tenant_id) updateData.tenant_id = data.tenant_id;
      if (data.registration_date) updateData.registration_date = data.registration_date;
      if (data.address) updateData.address = data.address;
      if (data.postal_address !== undefined) updateData.postal_address = data.postal_address || null;
      if (data.email) updateData.email = data.email;
      if (data.phone) updateData.phone = data.phone;
      if (data.total_members !== undefined) updateData.total_members = data.total_members;
      if (data.total_share_capital !== undefined) updateData.total_share_capital = data.total_share_capital;

      const { data: updatedCooperative, error: updateError } = await supabase
        .from('cooperatives')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return { success: true, data: updatedCooperative };
    } catch (err) {
      console.error('Error updating cooperative:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cooperative';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteCooperative = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('cooperatives')
        .update({ is_active: false })
        .eq('id', id);

      if (updateError) throw updateError;

      return { success: true };
    } catch (err) {
      console.error('Error deactivating cooperative:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate cooperative';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    createCooperative,
    updateCooperative,
    deleteCooperative,
    loadCooperativeTypes,
    loadCounties,
    generateRegistrationNumber,
    loading,
    error
  };
}
