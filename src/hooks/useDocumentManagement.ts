import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Document {
  id: string;
  document_number: string;
  title: string;
  description: string | null;
  document_type: string;
  cooperative_id: string | null;
  tenant_id: string;
  sectoral_category: string | null;
  storage_path: string;
  storage_bucket: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  version_number: number;
  parent_document_id: string | null;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  cooperatives?: {
    id: string;
    name: string;
  };
  tenants?: {
    id: string;
    name: string;
  };
  users?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface DocumentFilters {
  tenant_id?: string;
  cooperative_id?: string;
  sectoral_category?: string;
  document_type?: string;
  status?: 'ACTIVE' | 'ARCHIVED' | 'DELETED' | 'ALL';
  tags?: string[];
  mime_type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface DocumentSort {
  field: 'uploaded_at' | 'title' | 'file_size' | 'document_type' | 'tenant_id' | 'cooperative_id';
  direction: 'asc' | 'desc';
}

export interface UploadDocumentData {
  file: File;
  title: string;
  description?: string;
  document_type: string;
  cooperative_id?: string;
  tenant_id: string;
  sectoral_category?: string;
  tags?: string[];
}

export function useDocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const loadDocuments = useCallback(async (
    filters: DocumentFilters = {},
    sort: DocumentSort = { field: 'uploaded_at', direction: 'desc' },
    page: number = 1,
    pageSize: number = 20
  ) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('documents')
        .select(`
          *,
          cooperatives(id, name),
          tenants(id, name),
          users!documents_uploaded_by_fkey(id, full_name, email)
        `, { count: 'exact' });

      // Apply filters
      if (filters.tenant_id) {
        query = query.eq('tenant_id', filters.tenant_id);
      }
      if (filters.cooperative_id) {
        query = query.eq('cooperative_id', filters.cooperative_id);
      }
      if (filters.sectoral_category) {
        query = query.eq('sectoral_category', filters.sectoral_category);
      }
      if (filters.document_type) {
        query = query.eq('document_type', filters.document_type);
      }
      if (filters.status && filters.status !== 'ALL') {
        query = query.eq('status', filters.status);
      }
      if (filters.mime_type) {
        query = query.eq('mime_type', filters.mime_type);
      }
      if (filters.date_from) {
        query = query.gte('uploaded_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('uploaded_at', filters.date_to);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,document_number.ilike.%${filters.search}%`);
      }

      // Apply sorting
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setDocuments(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (data: UploadDocumentData): Promise<Document> => {
    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      // Generate document number
      const { data: docNumberData, error: docNumberError } = await supabase
        .rpc('generate_document_number');

      if (docNumberError) throw docNumberError;
      const document_number = docNumberData || `DOC/${new Date().getFullYear()}/${Date.now()}`;

      // Generate storage path
      const timestamp = Date.now();
      const extension = data.file.name.split('.').pop();
      const fileName = `${timestamp}_${data.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storagePath = `${data.tenant_id}/${data.cooperative_id || 'general'}/${data.document_type}/${fileName}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, data.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;
      setUploadProgress(50);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create document record
      const { data: documentData, error: insertError } = await supabase
        .from('documents')
        .insert({
          document_number,
          title: data.title,
          description: data.description || null,
          document_type: data.document_type,
          cooperative_id: data.cooperative_id || null,
          tenant_id: data.tenant_id,
          sectoral_category: data.sectoral_category || null,
          storage_path: storagePath,
          storage_bucket: 'documents',
          file_name: data.file.name,
          file_size: data.file.size,
          mime_type: data.file.type,
          uploaded_by: user.id,
          tags: data.tags || [],
          status: 'ACTIVE',
        })
        .select(`
          *,
          cooperatives(id, name),
          tenants(id, name),
          users!documents_uploaded_by_fkey(id, full_name, email)
        `)
        .single();

      if (insertError) throw insertError;

      // Log access
      await supabase
        .from('document_access_logs')
        .insert({
          document_id: documentData.id,
          user_id: user.id,
          action: 'UPLOAD',
        });

      setUploadProgress(100);
      return documentData;
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload document');
      throw err;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const updateDocument = useCallback(async (
    documentId: string,
    updates: Partial<Document>
  ): Promise<Document> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', documentId)
        .select(`
          *,
          cooperatives(id, name),
          tenants(id, name),
          users!documents_uploaded_by_fkey(id, full_name, email)
        `)
        .single();

      if (updateError) throw updateError;

      // Log access
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('document_access_logs')
          .insert({
            document_id: documentId,
            user_id: user.id,
            action: 'UPDATE',
          });
      }

      return data;
    } catch (err) {
      console.error('Error updating document:', err);
      setError(err instanceof Error ? err.message : 'Failed to update document');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (documentId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Soft delete by setting status to DELETED
      const { error: updateError } = await supabase
        .from('documents')
        .update({ status: 'DELETED' })
        .eq('id', documentId);

      if (updateError) throw updateError;

      // Log access
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('document_access_logs')
          .insert({
            document_id: documentId,
            user_id: user.id,
            action: 'DELETE',
          });
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete document');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const archiveDocument = useCallback(async (documentId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('documents')
        .update({ status: 'ARCHIVED' })
        .eq('id', documentId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error archiving document:', err);
      setError(err instanceof Error ? err.message : 'Failed to archive document');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDocumentUrl = useCallback(async (document: Document): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from(document.storage_bucket)
        .createSignedUrl(document.storage_path, 3600);

      if (error || !data?.signedUrl) {
        console.error('Error generating signed URL:', error);
        return null;
      }

      // Log access
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('document_access_logs')
          .insert({
            document_id: document.id,
            user_id: user.id,
            action: 'VIEW',
          });
      }

      return data.signedUrl;
    } catch (err) {
      console.error('Error generating document URL:', err);
      return null;
    }
  }, []);

  const getDocumentStatistics = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('tenant_id, cooperative_id, sectoral_category, document_type, status, file_size');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        byCounty: {} as Record<string, number>,
        byCooperative: {} as Record<string, number>,
        bySector: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        totalSize: data?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0,
      };

      data?.forEach(doc => {
        if (doc.tenant_id) {
          stats.byCounty[doc.tenant_id] = (stats.byCounty[doc.tenant_id] || 0) + 1;
        }
        if (doc.cooperative_id) {
          stats.byCooperative[doc.cooperative_id] = (stats.byCooperative[doc.cooperative_id] || 0) + 1;
        }
        if (doc.sectoral_category) {
          stats.bySector[doc.sectoral_category] = (stats.bySector[doc.sectoral_category] || 0) + 1;
        }
        if (doc.document_type) {
          stats.byType[doc.document_type] = (stats.byType[doc.document_type] || 0) + 1;
        }
        if (doc.status) {
          stats.byStatus[doc.status] = (stats.byStatus[doc.status] || 0) + 1;
        }
      });

      return stats;
    } catch (err) {
      console.error('Error loading document statistics:', err);
      return null;
    }
  }, []);

  return {
    documents,
    loading,
    error,
    totalCount,
    uploading,
    uploadProgress,
    loadDocuments,
    uploadDocument,
    updateDocument,
    deleteDocument,
    archiveDocument,
    getDocumentUrl,
    getDocumentStatistics,
  };
}

