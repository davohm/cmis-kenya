import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type AuditorQualification = 
  | 'CERTIFIED_PUBLIC_ACCOUNTANT'
  | 'CHARTERED_ACCOUNTANT'
  | 'COOPERATIVE_AUDITOR'
  | 'OTHER';

export type AuditorApplicationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export type AuditorSpecialization = 
  | 'SACCO'
  | 'AGRICULTURAL'
  | 'TRANSPORT'
  | 'HOUSING'
  | 'CONSUMER'
  | 'MARKETING'
  | 'DAIRY'
  | 'SAVINGS'
  | 'MULTIPURPOSE';

export interface AuditorApplication {
  id: string;
  application_number: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  id_number: string;
  qualification: AuditorQualification;
  certification_body: string;
  certificate_number: string;
  certificate_issue_date: string;
  years_experience: number;
  specializations: AuditorSpecialization[];
  professional_certificate_url: string;
  academic_certificates_url: string;
  practicing_certificate_url: string;
  id_copy_url: string;
  cv_url: string;
  status: AuditorApplicationStatus;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  verification_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  created_at: string;
  updated_at: string;
  reviewer?: {
    id: string;
    full_name: string;
  };
  approver?: {
    id: string;
    full_name: string;
  };
}

export interface AuditorProfile {
  id: string;
  user_id: string;
  application_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  photo_url: string | null;
  qualification: AuditorQualification;
  certification_body: string;
  certificate_number: string;
  years_experience: number;
  specializations: AuditorSpecialization[];
  total_audits_completed: number;
  cooperatives_audited: number;
  average_rating: number;
  is_active: boolean;
  certification_expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditorApplicationFilters {
  status?: AuditorApplicationStatus | 'ALL';
  qualification?: AuditorQualification | 'ALL';
  search?: string;
}

export interface AuditorDirectoryFilters {
  qualification?: AuditorQualification | 'ALL';
  specialization?: AuditorSpecialization | 'ALL';
  search?: string;
}

export interface SubmitApplicationData {
  full_name: string;
  email: string;
  phone: string;
  id_number: string;
  qualification: AuditorQualification;
  certification_body: string;
  certificate_number: string;
  certificate_issue_date: string;
  years_experience: number;
  specializations: AuditorSpecialization[];
  professional_certificate_url: string;
  academic_certificates_url: string;
  practicing_certificate_url: string;
  id_copy_url: string;
  cv_url: string;
  terms_accepted: boolean;
}

export function useAuditorApplications(
  role: string,
  userId: string | undefined,
  filters: AuditorApplicationFilters = {},
  page: number = 1,
  pageSize: number = 10
) {
  const [applications, setApplications] = useState<AuditorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadApplications();
  }, [role, userId, filters.status, filters.qualification, filters.search, page, pageSize]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('auditor_applications')
        .select(`
          *,
          reviewer:users!auditor_applications_reviewed_by_fkey(id, full_name),
          approver:users!auditor_applications_approved_by_fkey(id, full_name)
        `, { count: 'exact' });

      // Role-based filtering
      if (role === 'AUDITOR' && userId) {
        query = query.eq('user_id', userId);
      }
      // SUPER_ADMIN and COUNTY_ADMIN see all applications

      // Status filter
      if (filters.status && filters.status !== 'ALL') {
        query = query.eq('status', filters.status);
      }

      // Qualification filter
      if (filters.qualification && filters.qualification !== 'ALL') {
        query = query.eq('qualification', filters.qualification);
      }

      // Search filter
      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,certificate_number.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('submitted_at', { ascending: false });

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setApplications(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load applications';
      setError(errorMessage);
      console.error('Error loading auditor applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    loadApplications();
  };

  return { applications, loading, error, totalCount, refetch };
}

export function useAuditorDirectory(
  filters: AuditorDirectoryFilters = {},
  page: number = 1,
  pageSize: number = 12
) {
  const [auditors, setAuditors] = useState<AuditorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadAuditors();
  }, [filters.qualification, filters.specialization, filters.search, page, pageSize]);

  const loadAuditors = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('auditor_profiles')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      // Qualification filter
      if (filters.qualification && filters.qualification !== 'ALL') {
        query = query.eq('qualification', filters.qualification);
      }

      // Specialization filter
      if (filters.specialization && filters.specialization !== 'ALL') {
        query = query.contains('specializations', [filters.specialization]);
      }

      // Search filter
      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,certificate_number.ilike.%${filters.search}%,certification_body.ilike.%${filters.search}%`);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('total_audits_completed', { ascending: false });

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setAuditors(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load auditors';
      setError(errorMessage);
      console.error('Error loading auditor directory:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    loadAuditors();
  };

  return { auditors, loading, error, totalCount, refetch };
}

export function useAuditorActions() {
  const [submitting, setSubmitting] = useState(false);

  const submitApplication = async (
    userId: string,
    applicationData: SubmitApplicationData
  ): Promise<{ success: boolean; applicationNumber?: string; error?: string }> => {
    setSubmitting(true);
    try {
      const applicationNumber = `AUD-${Date.now()}`;

      const { error } = await supabase
        .from('auditor_applications')
        .insert([
          {
            application_number: applicationNumber,
            user_id: userId,
            ...applicationData,
            terms_accepted_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, applicationNumber };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit application';
      return { success: false, error: errorMessage };
    } finally {
      setSubmitting(false);
    }
  };

  const updateApplicationStatus = async (
    applicationId: string,
    status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED',
    reviewerId: string,
    notes?: string,
    rejectionReason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setSubmitting(true);
    try {
      const updateData: any = {
        status,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      };

      if (notes) {
        updateData.review_notes = notes;
      }

      if (status === 'APPROVED') {
        updateData.approved_by = reviewerId;
        updateData.approved_at = new Date().toISOString();
      } else if (status === 'REJECTED' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('auditor_applications')
        .update(updateData)
        .eq('id', applicationId);

      if (error) throw error;

      // If approved, create auditor profile
      if (status === 'APPROVED') {
        const { data: application } = await supabase
          .from('auditor_applications')
          .select('*')
          .eq('id', applicationId)
          .single();

        if (application) {
          const { error: profileError } = await supabase
            .from('auditor_profiles')
            .insert([
              {
                user_id: application.user_id,
                application_id: application.id,
                full_name: application.full_name,
                email: application.email,
                phone: application.phone,
                qualification: application.qualification,
                certification_body: application.certification_body,
                certificate_number: application.certificate_number,
                years_experience: application.years_experience,
                specializations: application.specializations,
                is_active: true,
              },
            ]);

          if (profileError) throw profileError;

          // Notification would be created here if needed
        }
      } else if (status === 'REJECTED') {
        const { data: application } = await supabase
          .from('auditor_applications')
          .select('user_id')
          .eq('id', applicationId)
          .single();

        if (application) {
          // Notification would be created here if needed
        }
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update application';
      return { success: false, error: errorMessage };
    } finally {
      setSubmitting(false);
    }
  };

  const addVerificationNotes = async (
    applicationId: string,
    notes: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('auditor_applications')
        .update({ verification_notes: notes })
        .eq('id', applicationId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add verification notes';
      return { success: false, error: errorMessage };
    }
  };

  return { submitApplication, updateApplicationStatus, addVerificationNotes, submitting };
}
