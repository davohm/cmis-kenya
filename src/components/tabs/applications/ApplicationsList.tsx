import { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApplications, ApplicationFilters } from '../../../hooks/useApplications';
import { supabase } from '../../../lib/supabase';
import type { Application } from '../../../hooks/useApplications';

interface ApplicationsListProps {
  role: string;
  tenantId: string | undefined;
  onSelectApplication: (application: Application) => void;
}

export default function ApplicationsList({ role, tenantId, onSelectApplication }: ApplicationsListProps) {
  const [filters, setFilters] = useState<ApplicationFilters>({ status: 'ALL' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [counties, setCounties] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);

  const { applications, loading, error, totalCount, totalPages } = useApplications(
    role,
    tenantId,
    { ...filters, search },
    page,
    10
  );

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    const { data: countiesData } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('type', 'COUNTY')
      .order('name');

    const { data: typesData } = await supabase
      .from('cooperative_types')
      .select('id, name, category')
      .order('category');

    setCounties(countiesData || []);
    setTypes(typesData || []);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-700';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-700';
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-700';
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'ADDITIONAL_INFO_REQUIRED': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (key: keyof ApplicationFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error loading applications: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Registration Applications</h2>
          <p className="text-gray-600 mt-1">Review and process cooperative registration applications</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by number or name..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
          </div>

          <select
            value={filters.status || 'ALL'}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ADDITIONAL_INFO_REQUIRED">Info Required</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {role === 'SUPER_ADMIN' && (
            <select
              value={filters.countyId || ''}
              onChange={(e) => handleFilterChange('countyId', e.target.value || undefined)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
            >
              <option value="">All Counties</option>
              {counties.map(county => (
                <option key={county.id} value={county.id}>{county.name}</option>
              ))}
            </select>
          )}

          <select
            value={filters.typeId || ''}
            onChange={(e) => handleFilterChange('typeId', e.target.value || undefined)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
          >
            <option value="">All Types</option>
            {types.map(type => (
              <option key={type.id} value={type.id}>{type.name} ({type.category})</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No applications found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Application No.</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Proposed Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">County</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Submitted</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900">{app.application_number}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{app.proposed_name}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {app.cooperative_types?.category || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {app.tenants?.name || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(app.status)}`}>
                          {formatStatus(app.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onSelectApplication(app)}
                          className="text-red-600 hover:text-red-700 font-semibold text-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-600">
                  Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, totalCount)} of {totalCount} applications
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
