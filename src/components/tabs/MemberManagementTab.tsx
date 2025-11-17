import { Users, Search, Filter, Download, Building2, MapPin, Calendar, Phone, Mail } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';

interface Member {
  id: string;
  cooperative_id: string;
  user_id: string | null;
  member_number: string;
  full_name: string;
  id_number: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  shares_owned: number;
  share_value: number;
  date_joined: string;
  is_active: boolean;
  created_at: string;
  cooperatives?: {
    id: string;
    name: string;
    registration_number: string | null;
    tenant_id: string;
    tenants?: {
      id: string;
      name: string;
    };
  };
}

interface MemberFilters {
  cooperative_id?: string;
  tenant_id?: string;
  is_active?: boolean;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export default function MemberManagementTab() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<MemberFilters>({ is_active: true });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [cooperatives, setCooperatives] = useState<Array<{ id: string; name: string }>>([]);
  const [tenants, setTenants] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadTenants();
    loadCooperatives();
  }, []);

  useEffect(() => {
    loadMembers();
  }, [filters, page, searchTerm]);

  useEffect(() => {
    if (filters.tenant_id) {
      loadCooperativesByTenant(filters.tenant_id);
    } else {
      loadCooperatives();
    }
  }, [filters.tenant_id]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('cooperative_members')
        .select(`
          *,
          cooperatives(
            id,
            name,
            registration_number,
            tenant_id,
            tenants(id, name)
          )
        `, { count: 'exact' })
        .order('date_joined', { ascending: false });

      // Apply filters
      if (filters.cooperative_id) {
        query = query.eq('cooperative_id', filters.cooperative_id);
      }
      if (filters.tenant_id) {
        // Filter by tenant through cooperatives
        const { data: coopIds } = await supabase
          .from('cooperatives')
          .select('id')
          .eq('tenant_id', filters.tenant_id);
        
        if (coopIds && coopIds.length > 0) {
          query = query.in('cooperative_id', coopIds.map(c => c.id));
        } else {
          query = query.eq('cooperative_id', '00000000-0000-0000-0000-000000000000'); // No results
        }
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.date_from) {
        query = query.gte('date_joined', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('date_joined', filters.date_to);
      }
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,member_number.ilike.%${searchTerm}%,id_number.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      setMembers(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error loading members:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const loadCooperatives = async () => {
    try {
      const { data, error } = await supabase
        .from('cooperatives')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCooperatives(data || []);
    } catch (err) {
      console.error('Error loading cooperatives:', err);
    }
  };

  const loadCooperativesByTenant = async (tenantId: string) => {
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

  const handleFilterChange = (key: keyof MemberFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ is_active: true });
    setSearchTerm('');
    setPage(1);
  };

  const handleExport = () => {
    const csv = [
      ['Member Number', 'Full Name', 'ID Number', 'Phone', 'Email', 'Cooperative', 'County', 'Shares Owned', 'Share Value', 'Date Joined', 'Status'].join(','),
      ...members.map(member => [
        member.member_number,
        member.full_name,
        member.id_number,
        member.phone || '',
        member.email || '',
        member.cooperatives?.name || 'N/A',
        member.cooperatives?.tenants?.name || 'N/A',
        member.shares_owned,
        member.share_value,
        member.date_joined,
        member.is_active ? 'Active' : 'Inactive'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.cooperative_id) count++;
    if (filters.tenant_id) count++;
    if (filters.is_active !== undefined && filters.is_active !== true) count++;
    if (filters.date_from || filters.date_to) count++;
    return count;
  }, [filters]);

  const stats = useMemo(() => {
    return {
      total: totalCount,
      active: members.filter(m => m.is_active).length,
      totalShares: members.reduce((sum, m) => sum + m.shares_owned, 0),
      totalShareValue: members.reduce((sum, m) => sum + Number(m.share_value || 0), 0)
    };
  }, [members, totalCount]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Member Management</h2>
          <p className="text-gray-600 mt-1">View and manage all cooperative members across the country</p>
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
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Members</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Active Members</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.active.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Shares</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.totalShares.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Share Value</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">{formatCurrency(stats.totalShareValue)}</div>
        </div>
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cooperative</label>
              <select
                value={filters.cooperative_id || ''}
                onChange={(e) => handleFilterChange('cooperative_id', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
                disabled={!filters.tenant_id && !cooperatives.length}
              >
                <option value="">All Cooperatives</option>
                {cooperatives.map(coop => (
                  <option key={coop.id} value={coop.id}>{coop.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.is_active === undefined ? '' : filters.is_active ? 'active' : 'inactive'}
                onChange={(e) => handleFilterChange('is_active', e.target.value === '' ? undefined : e.target.value === 'active')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search members by name, member number, ID number, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No members found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Member</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cooperative</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">County</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Shares</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date Joined</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{member.full_name}</div>
                          <div className="text-sm text-gray-500">#{member.member_number}</div>
                          <div className="text-xs text-gray-400">ID: {member.id_number}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-900">{member.cooperatives?.name || 'N/A'}</div>
                            {member.cooperatives?.registration_number && (
                              <div className="text-xs text-gray-500">{member.cooperatives.registration_number}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{member.cooperatives?.tenants?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">
                          {member.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                          {member.email && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Mail className="h-3 w-3" />
                              <span className="text-xs">{member.email}</span>
                            </div>
                          )}
                          {!member.phone && !member.email && 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{member.shares_owned.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{formatCurrency(Number(member.share_value || 0))}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(member.date_joined)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} members
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

