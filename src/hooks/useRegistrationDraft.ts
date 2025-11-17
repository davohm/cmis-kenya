import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface RegistrationFormData {
  proposed_name: string;
  type_id: string;
  proposed_members: number;
  proposed_share_capital: number;
  primary_activity: string;
  operating_area: string;
  address: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  bylaws_url?: string;
  member_list_url?: string;
  minutes_url?: string;
  id_copies_url?: string;
}

export interface DraftApplication {
  id?: string;
  application_number?: string;
  formData: RegistrationFormData;
  currentStep: number;
}

export function useRegistrationDraft() {
  const { user, profile } = useAuth();
  const [draft, setDraft] = useState<DraftApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadDraft();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadDraft = async () => {
    try {
      const { data, error } = await supabase
        .from('registration_applications')
        .select('*')
        .eq('applicant_user_id', user?.id)
        .eq('status', 'DRAFT')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setDraft({
          id: data.id,
          application_number: data.application_number,
          formData: {
            proposed_name: data.proposed_name || '',
            type_id: data.type_id || '',
            proposed_members: data.proposed_members || 0,
            proposed_share_capital: data.proposed_share_capital || 0,
            primary_activity: data.primary_activity || '',
            operating_area: data.operating_area || '',
            address: data.address || '',
            contact_person: data.contact_person || '',
            contact_phone: data.contact_phone || '',
            contact_email: data.contact_email || '',
            bylaws_url: data.bylaws_url || undefined,
            member_list_url: data.member_list_url || undefined,
            minutes_url: data.minutes_url || undefined,
            id_copies_url: data.id_copies_url || undefined,
          },
          currentStep: 1
        });
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateApplicationNumber = async (): Promise<string> => {
    const year = new Date().getFullYear();
    
    const { count } = await supabase
      .from('registration_applications')
      .select('*', { count: 'exact', head: true })
      .like('application_number', `REG-${year}-%`);

    const nextNumber = (count || 0) + 1;
    return `REG-${year}-${nextNumber.toString().padStart(4, '0')}`;
  };

  const ensureUserHasTenant = async (): Promise<string> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (profile?.tenant_id) {
      return profile.tenant_id;
    }

    const { data: nairobiTenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('county_code', '047')
      .single();

    if (tenantError) {
      console.error('Error fetching Nairobi tenant:', tenantError);
      throw new Error('Failed to assign default county');
    }

    const { error: userError } = await supabase
      .from('users')
      .update({ tenant_id: nairobiTenant.id })
      .eq('id', user.id);

    if (userError) {
      console.error('Error updating user tenant:', userError);
      throw new Error('Failed to update user tenant');
    }

    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        tenant_id: nairobiTenant.id,
        role: 'CITIZEN',
        is_active: true
      })
      .select()
      .maybeSingle();

    if (roleError && roleError.code !== '23505') {
      console.error('Error creating user role:', roleError);
    }

    return nairobiTenant.id;
  };

  const saveDraft = async (formData: RegistrationFormData, currentStep: number) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setSaving(true);
    try {
      const tenantId = await ensureUserHasTenant();

      if (draft?.id) {
        const { data, error } = await supabase
          .from('registration_applications')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', draft.id)
          .select()
          .single();

        if (error) throw error;

        setDraft({
          id: data.id,
          application_number: data.application_number,
          formData,
          currentStep
        });
      } else {
        const applicationNumber = await generateApplicationNumber();
        
        const { data, error } = await supabase
          .from('registration_applications')
          .insert({
            application_number: applicationNumber,
            applicant_user_id: user.id,
            tenant_id: tenantId,
            status: 'DRAFT',
            ...formData
          })
          .select()
          .single();

        if (error) throw error;

        setDraft({
          id: data.id,
          application_number: data.application_number,
          formData,
          currentStep
        });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const submitApplication = async (formData: RegistrationFormData) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setSaving(true);
    try {
      const tenantId = await ensureUserHasTenant();

      if (draft?.id) {
        const { data, error } = await supabase
          .from('registration_applications')
          .update({
            ...formData,
            status: 'SUBMITTED',
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', draft.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const applicationNumber = await generateApplicationNumber();
        
        const { data, error } = await supabase
          .from('registration_applications')
          .insert({
            application_number: applicationNumber,
            applicant_user_id: user.id,
            tenant_id: tenantId,
            status: 'SUBMITTED',
            submitted_at: new Date().toISOString(),
            ...formData
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const clearDraft = () => {
    setDraft(null);
  };

  return {
    draft,
    loading,
    saving,
    saveDraft,
    submitApplication,
    clearDraft
  };
}
