import { useState } from 'react';
import { supabase } from '../lib/supabase';

export interface CreateCountyData {
  name: string;
  county_code: string;
  contact_email: string;
  contact_phone: string;
  address?: string;
}

export interface UpdateCountyData {
  name?: string;
  county_code?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
}

export function useCountyCRUD() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCounty = async (data: CreateCountyData) => {
    try {
      setLoading(true);
      setError(null);

      const { data: existingCounty } = await supabase
        .from('tenants')
        .select('*')
        .eq('county_code', data.county_code)
        .eq('type', 'COUNTY')
        .maybeSingle();

      if (existingCounty) {
        throw new Error('A county with this county code already exists');
      }

      const { data: newCounty, error: insertError } = await supabase
        .from('tenants')
        .insert({
          name: data.name,
          type: 'COUNTY',
          county_code: data.county_code,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          address: data.address || null,
          is_active: true
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { success: true, data: newCounty };
    } catch (err) {
      console.error('Error creating county:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create county';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateCounty = async (id: string, data: UpdateCountyData) => {
    try {
      setLoading(true);
      setError(null);

      if (data.county_code) {
        const { data: existingCounty } = await supabase
          .from('tenants')
          .select('*')
          .eq('county_code', data.county_code)
          .eq('type', 'COUNTY')
          .neq('id', id)
          .maybeSingle();

        if (existingCounty) {
          throw new Error('A county with this county code already exists');
        }
      }

      const { data: updatedCounty, error: updateError } = await supabase
        .from('tenants')
        .update({
          ...(data.name && { name: data.name }),
          ...(data.county_code && { county_code: data.county_code }),
          ...(data.contact_email && { contact_email: data.contact_email }),
          ...(data.contact_phone && { contact_phone: data.contact_phone }),
          ...(data.address !== undefined && { address: data.address || null })
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return { success: true, data: updatedCounty };
    } catch (err) {
      console.error('Error updating county:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update county';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteCounty = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('tenants')
        .update({ is_active: false })
        .eq('id', id);

      if (updateError) throw updateError;

      return { success: true };
    } catch (err) {
      console.error('Error deleting county:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate county';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { createCounty, updateCounty, deleteCounty, loading, error };
}
