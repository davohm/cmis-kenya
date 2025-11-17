import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useCooperatives, CooperativeFilters } from '../../../hooks/useCooperatives';
import { supabase } from '../../../lib/supabase';
import type { Cooperative } from '../../../hooks/useCooperatives';

interface CooperativesListProps {
  role: string;
  tenantId: string | undefined;
  cooperativeId?: string | undefined;
  onSelectCooperative: (cooperative: Cooperative) => void;
}

export default function CooperativesList({ role, tenantId, cooperativeId, onSelectCooperative }: CooperativesListProps) {
  const [filters, setFilters] = useState<CooperativeFilters>({ status: 'ALL' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [counties, setCounties] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);

  const { cooperatives, loading, error, totalCount, totalPages } = useCooperatives(
    role,
    tenantId,
    cooperativeId,
    { ...filters, search },
    page,
    15
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
      case 'REGISTERED': return 'bg-blue-100 text-blue-700';
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'SUSPENDED': return 'bg-red-100 text-red-700';
      case 'INACTIVE': return 'bg-gray-100 text-gray-700';
      case 'PENDING_REGISTRATION': return 'bg-yellow-100 text-yellow-700';
      case 'UNDER_LIQUIDATION': return 'bg-orange-100 text-orange-700';
      case 'DISSOLVED': return 'bg-gray-200 text-gray-800';
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

  const handleFilterChange = (key: keyof CooperativeFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error loading cooperatives: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Registered Cooperatives</h2>
          <p className="text-gray-600 mt-1">View and manage registered cooperative societies</p>
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
            <option value="REGISTERED">Registered</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PENDING_REGISTRATION">Pending</option>
            <option value="UNDER_LIQUIDATION">Under Liquidation</option>
            <option value="DISSOLVED">Dissolved</option>
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
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading cooperatives...</div>
          </div>
        ) : cooperatives.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No cooperatives found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Registration Number</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cooperative Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">County</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Members</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Share Capital</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cooperatives.map((coop) => (
                    <tr key={coop.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {coop.registration_number || 'N/A'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{coop.name}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {coop.cooperative_types?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {coop.tenants?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(coop.status)}`}>
                          {formatStatus(coop.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {coop.total_members.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        KES {(coop.total_share_capital / 1000000).toFixed(2)}M
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => onSelectCooperative(coop)}
                          className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {((page - 1) * 15) + 1} to {Math.min(page * 15, totalCount)} of {totalCount} cooperatives
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
