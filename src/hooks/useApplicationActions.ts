import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useApplicationActions() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRegistrationNumber = async (tenantId: string): Promise<string> => {
    const year = new Date().getFullYear();
    
    const { count } = await supabase
      .from('cooperatives')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .like('registration_number', `COOP-${year}-%`);

    const nextNumber = (count || 0) + 1;
    return `COOP-${year}-${nextNumber.toString().padStart(5, '0')}`;
  };

  const approveApplication = async (applicationId: string) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      // Fetch application details
      const { data: application, error: fetchError } = await supabase
        .from('registration_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (fetchError) throw fetchError;
      if (!application) throw new Error('Application not found');

      // Generate registration number
      const registrationNumber = await generateRegistrationNumber(application.tenant_id);

      // Create cooperative record
      const { data: cooperative, error: coopError } = await supabase
        .from('cooperatives')
        .insert({
          registration_number: registrationNumber,
          name: application.proposed_name,
          type_id: application.type_id,
          tenant_id: application.tenant_id,
          status: 'REGISTERED',
          registration_date: new Date().toISOString().split('T')[0],
          address: application.address,
          email: application.contact_email,
          phone: application.contact_phone,
          total_members: application.proposed_members,
          total_share_capital: application.proposed_share_capital || 0,
          is_active: true
        })
        .select()
        .single();

      if (coopError) throw coopError;

      // Update application status
      const { error: updateError } = await supabase
        .from('registration_applications')
        .update({
          status: 'APPROVED',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      return cooperative;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve application';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const rejectApplication = async (applicationId: string, reason: string) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('registration_applications')
        .update({
          status: 'REJECTED',
          rejection_reason: reason,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject application';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const requestInfo = async (applicationId: string, notes: string) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('registration_applications')
        .update({
          status: 'ADDITIONAL_INFO_REQUIRED',
          review_notes: notes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request additional information';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    approveApplication,
    rejectApplication,
    requestInfo
  };
}
