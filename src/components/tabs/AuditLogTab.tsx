import { FileText, Search, Filter, Download, Calendar, User, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  user_id: string;
  tenant_id: string | null;
  metadata: any;
  created_at: string;
  users?: {
    id: string;
    full_name: string;
    email: string;
  };
  tenants?: {
    id: string;
    name: string;
  };
}

export default function AuditLogTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    resource_type: '',
    user_id: '',
    tenant_id: '',
    date_from: '',
    date_to: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [users, setUsers] = useState<Array<{ id: string; full_name: string }>>([]);
  const [tenants, setTenants] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadAuditLogs();
    loadUsers();
    loadTenants();
  }, [filters, page, searchTerm]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          users(id, full_name, email),
          tenants(id, name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * 20, page * 20 - 1);

      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.tenant_id) {
        query = query.eq('tenant_id', filters.tenant_id);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('id, full_name')
        .order('full_name');
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const loadTenants = async () => {
    try {
      const { data } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      setTenants(data || []);
    } catch (err) {
      console.error('Error loading tenants:', err);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Action', 'Resource Type', 'User', 'Tenant', 'Details'].join(','),
      ...logs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.action,
        log.resource_type,
        log.users?.full_name || 'N/A',
        log.tenants?.name || 'N/A',
        JSON.stringify(log.metadata || {})
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getActionColor = (action: string): string => {
    const colors: Record<string, string> = {
      'CREATE': 'bg-green-100 text-green-800',
      'UPDATE': 'bg-blue-100 text-blue-800',
      'DELETE': 'bg-red-100 text-red-800',
      'VIEW': 'bg-gray-100 text-gray-800',
      'LOGIN': 'bg-purple-100 text-purple-800',
      'LOGOUT': 'bg-yellow-100 text-yellow-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Audit Logs</h2>
          <p className="text-gray-600 mt-1">View system activity and user actions</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="VIEW">View</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
            <select
              value={filters.resource_type}
              onChange={(e) => setFilters({ ...filters, resource_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
            >
              <option value="">All Types</option>
              <option value="cooperatives">Cooperatives</option>
              <option value="users">Users</option>
              <option value="applications">Applications</option>
              <option value="documents">Documents</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <select
              value={filters.user_id}
              onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
            <select
              value={filters.tenant_id}
              onChange={(e) => setFilters({ ...filters, tenant_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
            >
              <option value="">All Tenants</option>
              {tenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No audit logs found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Resource</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tenant</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{log.resource_type}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{log.users?.full_name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{log.tenants?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.metadata ? JSON.stringify(log.metadata).substring(0, 50) + '...' : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, totalCount)} of {totalCount} logs
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * 20 >= totalCount}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
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

