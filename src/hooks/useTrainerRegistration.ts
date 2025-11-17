import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type EducationLevel = 
  | 'DIPLOMA'
  | 'DEGREE'
  | 'MASTERS'
  | 'PHD';

export type TrainerSpecialization = 
  | 'GOVERNANCE'
  | 'FINANCIAL_MANAGEMENT'
  | 'BOOKKEEPING'
  | 'LEADERSHIP'
  | 'COMPLIANCE'
  | 'DIGITAL_LITERACY'
  | 'ENTREPRENEURSHIP'
  | 'OTHER';

export type InstructionLanguage = 
  | 'ENGLISH'
  | 'SWAHILI'
  | 'OTHER';

export type TrainerApplicationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface TrainerApplication {
  id: string;
  application_number: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  id_number: string;
  education_level: EducationLevel;
  institution: string;
  years_experience: number;
  specializations: TrainerSpecialization[];
  languages: InstructionLanguage[];
  academic_certificates_url: string;
  training_certificates_url: string;
  sample_materials_url: string;
  id_copy_url: string;
  cv_url: string;
  status: TrainerApplicationStatus;
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

export interface TrainerProfile {
  id: string;
  user_id: string;
  application_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  photo_url: string | null;
  education_level: EducationLevel;
  institution: string;
  years_experience: number;
  specializations: TrainerSpecialization[];
  languages: InstructionLanguage[];
  total_programs_delivered: number;
  total_participants_trained: number;
  average_rating: number;
  is_active: boolean;
  certification_expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainerApplicationFilters {
  status?: TrainerApplicationStatus | 'ALL';
  specialization?: TrainerSpecialization | 'ALL';
  search?: string;
}

export interface TrainerDirectoryFilters {
  education_level?: EducationLevel | 'ALL';
  specialization?: TrainerSpecialization | 'ALL';
  language?: InstructionLanguage | 'ALL';
  search?: string;
}

export interface SubmitApplicationData {
  full_name: string;
  email: string;
  phone: string;
  id_number: string;
  education_level: EducationLevel;
  institution: string;
  years_experience: number;
  specializations: TrainerSpecialization[];
  languages: InstructionLanguage[];
  academic_certificates_url: string;
  training_certificates_url: string;
  sample_materials_url: string;
  id_copy_url: string;
  cv_url: string;
  terms_accepted: boolean;
}

export function useTrainerApplications(
  role: string,
  userId: string | undefined,
  filters: TrainerApplicationFilters = {},
  page: number = 1,
  pageSize: number = 10
) {
  const [applications, setApplications] = useState<TrainerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadApplications();
  }, [role, userId, filters.status, filters.specialization, filters.search, page, pageSize]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('trainer_applications')
        .select(`
          *,
          reviewer:users!trainer_applications_reviewed_by_fkey(id, full_name),
          approver:users!trainer_applications_approved_by_fkey(id, full_name)
        `, { count: 'exact' });

      if (role === 'TRAINER' && userId) {
        query = query.eq('user_id', userId);
      }

      if (filters.status && filters.status !== 'ALL') {
        query = query.eq('status', filters.status);
      }

      if (filters.specialization && filters.specialization !== 'ALL') {
        query = query.contains('specializations', [filters.specialization]);
      }

      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error: fetchError, count } = await query
        .order('submitted_at', { ascending: false })
        .range(from, to);

      if (fetchError) throw fetchError;

      setApplications(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error loading trainer applications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  return { applications, loading, error, totalCount, refresh: loadApplications };
}

export function useTrainerDirectory(
  filters: TrainerDirectoryFilters = {},
  page: number = 1,
  pageSize: number = 12
) {
  const [trainers, setTrainers] = useState<TrainerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadTrainers();
  }, [filters.education_level, filters.specialization, filters.language, filters.search, page, pageSize]);

  const loadTrainers = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('trainer_profiles')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      if (filters.education_level && filters.education_level !== 'ALL') {
        query = query.eq('education_level', filters.education_level);
      }

      if (filters.specialization && filters.specialization !== 'ALL') {
        query = query.contains('specializations', [filters.specialization]);
      }

      if (filters.language && filters.language !== 'ALL') {
        query = query.contains('languages', [filters.language]);
      }

      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,institution.ilike.%${filters.search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error: fetchError, count } = await query
        .order('total_programs_delivered', { ascending: false })
        .range(from, to);

      if (fetchError) throw fetchError;

      setTrainers(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error loading trainers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trainers');
    } finally {
      setLoading(false);
    }
  };

  return { trainers, loading, error, totalCount, refresh: loadTrainers };
}

export function useTrainerActions() {
  const [submitting, setSubmitting] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const submitApplication = async (
    userId: string,
    applicationData: SubmitApplicationData
  ): Promise<{ success: boolean; applicationNumber?: string; error?: string }> => {
    try {
      setSubmitting(true);

      const applicationNumber = `TRN-${Date.now()}`;

      const { error } = await supabase
        .from('trainer_applications')
        .insert({
          application_number: applicationNumber,
          user_id: userId,
          ...applicationData,
          terms_accepted_at: new Date().toISOString(),
          status: 'PENDING'
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, applicationNumber };
    } catch (err) {
      console.error('Error submitting trainer application:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to submit application'
      };
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
    try {
      setReviewing(true);

      const updateData: any = {
        status,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        review_notes: notes
      };

      if (status === 'APPROVED') {
        updateData.approved_by = reviewerId;
        updateData.approved_at = new Date().toISOString();
      } else if (status === 'REJECTED') {
        updateData.rejection_reason = rejectionReason;
      }

      const { error: updateError } = await supabase
        .from('trainer_applications')
        .update(updateData)
        .eq('id', applicationId);

      if (updateError) throw updateError;

      if (status === 'APPROVED') {
        const { data: application, error: fetchError } = await supabase
          .from('trainer_applications')
          .select('*')
          .eq('id', applicationId)
          .single();

        if (fetchError) throw fetchError;

        const { error: profileError } = await supabase
          .from('trainer_profiles')
          .insert({
            user_id: application.user_id,
            application_id: applicationId,
            full_name: application.full_name,
            email: application.email,
            phone: application.phone,
            education_level: application.education_level,
            institution: application.institution,
            years_experience: application.years_experience,
            specializations: application.specializations,
            languages: application.languages,
            is_active: true
          });

        if (profileError) throw profileError;

        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: application.user_id,
            role: 'TRAINER'
          });

        if (roleError) throw roleError;
      }

      return { success: true };
    } catch (err) {
      console.error('Error updating application status:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update application'
      };
    } finally {
      setReviewing(false);
    }
  };

  const updateVerificationNotes = async (
    applicationId: string,
    verificationNotes: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('trainer_applications')
        .update({ verification_notes: verificationNotes })
        .eq('id', applicationId);

      if (error) throw error;

      return { success: true };
    } catch (err) {
      console.error('Error updating verification notes:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update verification notes'
      };
    }
  };

  return {
    submitApplication,
    updateApplicationStatus,
    updateVerificationNotes,
    submitting,
    reviewing
  };
}
