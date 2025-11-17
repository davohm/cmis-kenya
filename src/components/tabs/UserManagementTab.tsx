import { Users, Search, Plus, Edit, Trash2, Shield, UserPlus, Filter, X } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useUserManagement, User, UserFilters, CreateUserData } from '../../hooks/useUserManagement';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import CreateStandaloneUserModal from '../admin/CreateStandaloneUserModal';
import UserRoleManagementModal from '../admin/UserRoleManagementModal';

interface Tenant {
  id: string;
  name: string;
}

const USER_ROLES = [
  'SUPER_ADMIN',
  'COUNTY_ADMIN',
  'COUNTY_OFFICER',
  'COOPERATIVE_ADMIN',
  'AUDITOR',
  'TRAINER',
  'CITIZEN'
];

export default function UserManagementTab() {
  const { profile } = useAuth();
  const {
    users,
    loading,
    error,
    totalCount,
    loadUsers,
    createUser,
    updateUser,
    deactivateUser,
    assignRole,
    removeRole,
  } = useUserManagement();

  const [filters, setFilters] = useState<UserFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    loadUsers(
      { ...filters, search: searchTerm || undefined },
      page,
      pageSize
    );
  }, [filters, page, searchTerm, loadUsers]);

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

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setPage(1);
  };

  const handleCreateUser = async (userData: CreateUserData & { tempPassword?: string }) => {
    try {
      await createUser({
        email: userData.email,
        full_name: userData.full_name,
        phone: userData.phone,
        id_number: userData.id_number,
        tenant_id: userData.tenant_id,
        role: userData.role
      });
      setShowCreateModal(false);
      loadUsers(filters, page, pageSize);
    } catch (err) {
      console.error('Error creating user:', err);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) {
      return;
    }

    try {
      await deactivateUser(userId);
      loadUsers(filters, page, pageSize);
    } catch (err) {
      console.error('Error deactivating user:', err);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoleBadgeColor = (role: string): string => {
    const colors: Record<string, string> = {
      'SUPER_ADMIN': 'bg-red-100 text-red-800',
      'COUNTY_ADMIN': 'bg-green-100 text-green-800',
      'COUNTY_OFFICER': 'bg-blue-100 text-blue-800',
      'COOPERATIVE_ADMIN': 'bg-purple-100 text-purple-800',
      'AUDITOR': 'bg-gray-100 text-gray-800',
      'TRAINER': 'bg-yellow-100 text-yellow-800',
      'CITIZEN': 'bg-gray-100 text-gray-600',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.role) count++;
    if (filters.tenant_id) count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">Manage all system users and their roles</p>
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
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Users</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Active Users</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {users.filter(u => u.user_roles?.some(ur => ur.is_active)).length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">County Admins</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {users.filter(u => u.user_roles?.some(ur => ur.role === 'COUNTY_ADMIN' && ur.is_active)).length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">County Officers</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {users.filter(u => u.user_roles?.some(ur => ur.role === 'COUNTY_OFFICER' && ur.is_active)).length}
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={filters.role || ''}
                onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
              >
                <option value="">All Roles</option>
                {USER_ROLES.map(role => (
                  <option key={role} value={role}>{role.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                County/Tenant
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
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or ID number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading users...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No users found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      County/Tenant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.id_number && (
                            <div className="text-xs text-gray-400">ID: {user.id_number}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.user_roles?.filter(ur => ur.is_active).map((role) => (
                            <span
                              key={role.id}
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(role.role)}`}
                            >
                              {role.role.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {user.tenants?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {user.phone || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowRoleModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Manage Roles"
                          >
                            <Shield className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeactivateUser(user.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Deactivate"
                          >
                            <Trash2 className="h-4 w-4" />
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
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} users
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

      {/* Create User Modal */}
      <CreateStandaloneUserModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          loadUsers(filters, page, pageSize);
        }}
        onSuccess={handleCreateUser}
      />

      {/* Role Management Modal */}
      <UserRoleManagementModal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSuccess={() => {
          loadUsers(filters, page, pageSize);
        }}
      />
    </div>
  );
}

