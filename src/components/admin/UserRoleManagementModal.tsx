import { X, Plus, Trash2, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUserManagement, User } from '../../hooks/useUserManagement';
import { supabase } from '../../lib/supabase';

interface UserRoleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: () => void;
}

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

export default function UserRoleManagementModal({
  isOpen,
  onClose,
  user,
  onSuccess
}: UserRoleManagementModalProps) {
  const { assignRole, removeRole, loading } = useUserManagement();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [newRole, setNewRole] = useState({
    role: 'CITIZEN',
    tenant_id: ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTenants();
    }
  }, [isOpen]);

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

  const handleAddRole = async () => {
    if (!user || !newRole.tenant_id) {
      setError('Please select a tenant');
      return;
    }

    try {
      setError(null);
      await assignRole(user.id, newRole.role, newRole.tenant_id);
      setNewRole({ role: 'CITIZEN', tenant_id: '' });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to remove this role?')) {
      return;
    }

    try {
      setError(null);
      await removeRole(roleId);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove role');
    }
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

  if (!isOpen || !user) return null;

  const activeRoles = user.user_roles?.filter(ur => ur.is_active) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Manage User Roles</h3>
              <p className="text-sm text-gray-600">{user.full_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Current Roles */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Roles</h4>
            {activeRoles.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No active roles assigned</p>
            ) : (
              <div className="space-y-3">
                {activeRoles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(role.role)}`}>
                        {role.role.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-600">
                        {role.tenants?.name || 'N/A'}
                      </span>
                      <span className="text-xs text-gray-400">
                        Assigned: {new Date(role.assigned_at).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveRole(role.id)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove role"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Role */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Add New Role</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={newRole.role}
                  onChange={(e) => setNewRole({ ...newRole, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
                >
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
                  value={newRole.tenant_id}
                  onChange={(e) => setNewRole({ ...newRole, tenant_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
                >
                  <option value="">Select County/Tenant</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleAddRole}
              disabled={loading || !newRole.tenant_id}
              className="mt-4 flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>Add Role</span>
            </button>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

