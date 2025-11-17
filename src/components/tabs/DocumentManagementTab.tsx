import { FileText, Search, Plus, Filter, Download, Archive, Trash2, Eye, Calendar, MapPin, Building2, Tag, X } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useDocumentManagement, Document, DocumentFilters, DocumentSort } from '../../hooks/useDocumentManagement';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Tenant {
  id: string;
  name: string;
}

interface Cooperative {
  id: string;
  name: string;
}

const DOCUMENT_TYPES = [
  'REGISTRATION',
  'COMPLIANCE',
  'AUDIT',
  'AMENDMENT',
  'FINANCIAL',
  'LEGAL',
  'TRAINING',
  'RESEARCH',
  'OTHER'
];

const SECTORAL_CATEGORIES = [
  'SACCO',
  'AGRICULTURAL',
  'DAIRY',
  'TRANSPORT',
  'MARKETING',
  'HOUSING',
  'CONSUMER',
  'OTHER'
];

const STATUS_OPTIONS = ['ACTIVE', 'ARCHIVED', 'DELETED', 'ALL'];

export default function DocumentManagementTab() {
  const { profile, hasRole } = useAuth();
  const isSuperAdmin = hasRole('SUPER_ADMIN');
  
  const {
    documents,
    loading,
    error,
    totalCount,
    loadDocuments,
    uploadDocument,
    updateDocument,
    deleteDocument,
    archiveDocument,
    getDocumentUrl,
    getDocumentStatistics,
  } = useDocumentManagement();

  const [filters, setFilters] = useState<DocumentFilters>({
    status: 'ACTIVE',
  });
  const [sort, setSort] = useState<DocumentSort>({
    field: 'uploaded_at',
    direction: 'desc',
  });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    loadTenants();
    loadStatistics();
  }, []);

  useEffect(() => {
    loadDocuments(
      { ...filters, search: searchTerm || undefined },
      sort,
      page,
      pageSize
    );
  }, [filters, sort, page, searchTerm, loadDocuments]);

  useEffect(() => {
    if (filters.tenant_id) {
      loadCooperatives(filters.tenant_id);
    } else {
      setCooperatives([]);
    }
  }, [filters.tenant_id]);

  const loadTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTenants(data || []);
    } catch (err) {
      console.error('Error loading tenants:', err);
    }
  };

  const loadCooperatives = async (tenantId: string) => {
    try {
      const { data, error } = await supabase
        .from('cooperatives')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCooperatives(data || []);
    } catch (err) {
      console.error('Error loading cooperatives:', err);
    }
  };

  const loadStatistics = async () => {
    const stats = await getDocumentStatistics();
    setStatistics(stats);
  };

  const handleFilterChange = (key: keyof DocumentFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ status: 'ACTIVE' });
    setSearchTerm('');
    setPage(1);
  };

  const handleSort = (field: DocumentSort['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSelectDocument = (documentId: string) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedDocuments.size === documents.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(documents.map(d => d.id)));
    }
  };

  const handleBulkArchive = async () => {
    if (selectedDocuments.size === 0) return;
    
    try {
      for (const docId of selectedDocuments) {
        await archiveDocument(docId);
      }
      setSelectedDocuments(new Set());
      loadDocuments(filters, sort, page, pageSize);
    } catch (err) {
      console.error('Error archiving documents:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedDocuments.size} document(s)?`)) {
      return;
    }

    try {
      for (const docId of selectedDocuments) {
        await deleteDocument(docId);
      }
      setSelectedDocuments(new Set());
      loadDocuments(filters, sort, page, pageSize);
    } catch (err) {
      console.error('Error deleting documents:', err);
    }
  };

  const handleViewDocument = async (document: Document) => {
    const url = await getDocumentUrl(document);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleDownloadDocument = async (document: Document) => {
    const url = await getDocumentUrl(document);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      a.click();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.tenant_id) count++;
    if (filters.cooperative_id) count++;
    if (filters.sectoral_category) count++;
    if (filters.document_type) count++;
    if (filters.status && filters.status !== 'ALL') count++;
    if (filters.mime_type) count++;
    if (filters.date_from || filters.date_to) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Document Management</h2>
          <p className="text-gray-600 mt-1">Manage documents across all counties and cooperatives</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Documents</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{statistics.total}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {statistics.byStatus?.ACTIVE || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Archived</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {statistics.byStatus?.ARCHIVED || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Size</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {formatFileSize(statistics.totalSize || 0)}
            </div>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* County Filter */}
            {isSuperAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  County
                </label>
                <select
                  value={filters.tenant_id || ''}
                  onChange={(e) => handleFilterChange('tenant_id', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
                >
                  <option value="">All Counties</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Cooperative Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cooperative
              </label>
              <select
                value={filters.cooperative_id || ''}
                onChange={(e) => handleFilterChange('cooperative_id', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
                disabled={!filters.tenant_id}
              >
                <option value="">All Cooperatives</option>
                {cooperatives.map(coop => (
                  <option key={coop.id} value={coop.id}>{coop.name}</option>
                ))}
              </select>
            </div>

            {/* Sectoral Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sectoral Category
              </label>
              <select
                value={filters.sectoral_category || ''}
                onChange={(e) => handleFilterChange('sectoral_category', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
              >
                <option value="">All Sectors</option>
                {SECTORAL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Document Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Type
              </label>
              <select
                value={filters.document_type || ''}
                onChange={(e) => handleFilterChange('document_type', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
              >
                <option value="">All Types</option>
                {DOCUMENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status || 'ALL'}
                onChange={(e) => handleFilterChange('status', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Search and Bulk Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents by title, description, or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
              />
            </div>
          </div>
          {selectedDocuments.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedDocuments.size} selected
              </span>
              <button
                onClick={handleBulkArchive}
                className="flex items-center space-x-1 px-3 py-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
              >
                <Archive className="h-4 w-4" />
                <span>Archive</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading documents...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No documents found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.size === documents.length && documents.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-600"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    {isSuperAdmin && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        County
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Cooperative
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Sector
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {documents.map((document) => (
                    <tr key={document.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedDocuments.has(document.id)}
                          onChange={() => handleSelectDocument(document.id)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{document.title}</div>
                          <div className="text-sm text-gray-500">{document.document_number}</div>
                          {document.description && (
                            <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                              {document.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {document.document_type}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {document.tenants?.name || 'N/A'}
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {document.cooperatives?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {document.sectoral_category || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatFileSize(document.file_size)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(document.uploaded_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDocument(document)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(document)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} documents
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * pageSize >= totalCount}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

