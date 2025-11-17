import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNotifications } from './useNotifications';

export type ComplaintCategory = 
  | 'GOVERNANCE'
  | 'FINANCIAL_MISMANAGEMENT'
  | 'MEMBER_DISPUTE'
  | 'SERVICE_DELIVERY'
  | 'FRAUD'
  | 'CORRUPTION'
  | 'OTHER';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ComplaintStatus = 'RECEIVED' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';

export interface Complaint {
  id: string;
  inquiry_number: string; // Used as complaint_number
  cooperative_id: string | null;
  requester_user_id: string | null;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  subject: string;
  description: string;
  complaint_category: ComplaintCategory | null;
  priority: ComplaintPriority;
  complaint_status: ComplaintStatus;
  is_anonymous: boolean;
  evidence_documents: string[] | null;
  assigned_to: string | null;
  investigation_notes: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
  cooperatives?: {
    id: string;
    name: string;
    registration_number: string;
    tenant_id: string;
  };
  assigned_user?: {
    id: string;
    full_name: string;
  };
  resolved_by_user?: {
    id: string;
    full_name: string;
  };
}

export interface ComplaintFilters {
  status?: ComplaintStatus | 'ALL';
  category?: ComplaintCategory | 'ALL';
  priority?: ComplaintPriority | 'ALL';
  cooperativeId?: string;
  search?: string;
}

export function useComplaints(
  role: string,
  tenantId: string | undefined,
  cooperativeId: string | undefined,
  userId: string | undefined,
  filters: ComplaintFilters = {},
  page: number = 1,
  pageSize: number = 10
) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const { createNotification } = useNotifications();

  useEffect(() => {
    loadComplaints();
  }, [role, tenantId, cooperativeId, userId, filters.status, filters.category, filters.priority, filters.cooperativeId, filters.search, page, pageSize]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('inquiry_requests')
        .select(`
          *,
          cooperatives(id, name, registration_number, tenant_id),
          assigned_user:users!inquiry_requests_assigned_to_fkey(id, full_name),
          resolved_by_user:users!inquiry_requests_resolved_by_fkey(id, full_name)
        `, { count: 'exact' })
        .not('complaint_category', 'is', null); // Only fetch complaints (not general inquiries)

      // Role-based filtering
      if (role === 'COOPERATIVE_ADMIN' && cooperativeId) {
        // Cooperative sees complaints against them
        query = query.eq('cooperative_id', cooperativeId);
      } else if (role === 'COUNTY_ADMIN' && tenantId) {
        // County admin sees complaints in their jurisdiction
        const { data: coopIds } = await supabase
          .from('cooperatives')
          .select('id')
          .eq('tenant_id', tenantId);
        
        if (coopIds && coopIds.length > 0) {
          query = query.in('cooperative_id', coopIds.map(c => c.id));
        } else {
          setComplaints([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }
      } else if (role === 'CITIZEN' && userId) {
        // Citizens see their own complaints
        query = query.eq('requester_user_id', userId);
      }
      // SUPER_ADMIN sees all complaints

      // Status filter
      if (filters.status && filters.status !== 'ALL') {
        query = query.eq('complaint_status', filters.status);
      }

      // Category filter
      if (filters.category && filters.category !== 'ALL') {
        query = query.eq('complaint_category', filters.category);
      }

      // Priority filter
      if (filters.priority && filters.priority !== 'ALL') {
        query = query.eq('priority', filters.priority);
      }

      // Specific cooperative filter
      if (filters.cooperativeId) {
        query = query.eq('cooperative_id', filters.cooperativeId);
      }

      // Search filter
      if (filters.search) {
        query = query.or(`inquiry_number.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Order by created_at desc
      query = query.order('created_at', { ascending: false });

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setComplaints(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error loading complaints:', err);
      setError(err instanceof Error ? err.message : 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const submitComplaint = async (complaintData: {
    cooperative_id: string;
    requester_user_id?: string;
    requester_name: string;
    requester_email: string;
    requester_phone?: string;
    subject: string;
    description: string;
    complaint_category: ComplaintCategory;
    priority: ComplaintPriority;
    is_anonymous: boolean;
    evidence_documents?: string[];
  }) => {
    try {
      // Generate complaint number
      const year = new Date().getFullYear();
      const complaintNumber = `CPL-${year}-${Date.now().toString().slice(-6)}`;

      const { data, error: insertError } = await supabase
        .from('inquiry_requests')
        .insert({
          inquiry_number: complaintNumber,
          cooperative_id: complaintData.cooperative_id,
          requester_user_id: complaintData.is_anonymous ? null : complaintData.requester_user_id,
          requester_name: complaintData.is_anonymous ? 'Anonymous' : complaintData.requester_name,
          requester_email: complaintData.requester_email,
          requester_phone: complaintData.is_anonymous ? null : complaintData.requester_phone,
          subject: complaintData.subject,
          description: complaintData.description,
          complaint_category: complaintData.complaint_category,
          priority: complaintData.priority,
          complaint_status: 'RECEIVED',
          is_anonymous: complaintData.is_anonymous,
          evidence_documents: complaintData.evidence_documents || [],
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Notify cooperative admins about new complaint
      if (data) {
        // Get cooperative admins
        const { data: coopMembers } = await supabase
          .from('cooperative_members')
          .select('user_id')
          .eq('cooperative_id', complaintData.cooperative_id)
          .eq('is_active', true);

        if (coopMembers) {
          for (const member of coopMembers) {
            if (member.user_id) {
              await createNotification({
                user_id: member.user_id,
                title: 'New Complaint Filed',
                message: `A new ${complaintData.priority} priority complaint has been filed: ${complaintData.subject}`,
                type: 'warning'
              });
            }
          }
        }
      }

      return { success: true, data };
    } catch (err) {
      console.error('Error submitting complaint:', err);
      return { success: false, error: err };
    }
  };

  const updateComplaintStatus = async (
    complaintId: string,
    status: ComplaintStatus,
    userId: string,
    notes?: string
  ) => {
    try {
      const updateData: any = {
        complaint_status: status,
        updated_at: new Date().toISOString()
      };

      if (status === 'INVESTIGATING') {
        updateData.assigned_to = userId;
      }

      if (status === 'RESOLVED' || status === 'DISMISSED') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = userId;
        if (notes) {
          updateData.resolution_notes = notes;
        }
      }

      const { data, error: updateError } = await supabase
        .from('inquiry_requests')
        .update(updateData)
        .eq('id', complaintId)
        .select(`
          *,
          cooperatives(name)
        `)
        .single();

      if (updateError) throw updateError;

      // Notify complainant about status change
      if (data && data.requester_user_id) {
        const statusMessages = {
          INVESTIGATING: {
            title: 'Complaint Under Investigation',
            message: `Your complaint "${data.subject}" is now being investigated.`,
            type: 'info' as const
          },
          RESOLVED: {
            title: 'Complaint Resolved',
            message: `Your complaint "${data.subject}" has been resolved.`,
            type: 'success' as const
          },
          DISMISSED: {
            title: 'Complaint Dismissed',
            message: `Your complaint "${data.subject}" has been dismissed. ${notes || ''}`,
            type: 'warning' as const
          }
        };

        const notification = statusMessages[status as keyof typeof statusMessages];
        if (notification) {
          await createNotification({
            user_id: data.requester_user_id,
            ...notification
          });
        }
      }

      return { success: true, data };
    } catch (err) {
      console.error('Error updating complaint status:', err);
      return { success: false, error: err };
    }
  };

  const addInvestigationNotes = async (
    complaintId: string,
    notes: string
  ) => {
    try {
      const { data, error: updateError } = await supabase
        .from('inquiry_requests')
        .update({
          investigation_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', complaintId)
        .select()
        .single();

      if (updateError) throw updateError;

      return { success: true, data };
    } catch (err) {
      console.error('Error adding investigation notes:', err);
      return { success: false, error: err };
    }
  };

  const assignInvestigator = async (
    complaintId: string,
    investigatorId: string
  ) => {
    try {
      const { data, error: updateError } = await supabase
        .from('inquiry_requests')
        .update({
          assigned_to: investigatorId,
          complaint_status: 'INVESTIGATING',
          updated_at: new Date().toISOString()
        })
        .eq('id', complaintId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Notify investigator
      await createNotification({
        user_id: investigatorId,
        title: 'Complaint Assigned to You',
        message: `You have been assigned to investigate complaint: ${data.subject}`,
        type: 'info'
      });

      return { success: true, data };
    } catch (err) {
      console.error('Error assigning investigator:', err);
      return { success: false, error: err };
    }
  };

  const refetch = () => {
    loadComplaints();
  };

  return {
    complaints,
    loading,
    error,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    submitComplaint,
    updateComplaintStatus,
    addInvestigationNotes,
    assignInvestigator,
    refetch
  };
}
