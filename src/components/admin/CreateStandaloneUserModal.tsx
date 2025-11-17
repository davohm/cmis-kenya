import { X, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserManagement } from '../../hooks/useUserManagement';
import { supabase } from '../../lib/supabase';

interface CreateStandaloneUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: {
    email: string;
    full_name: string;
    phone: string;
    id_number: string;
    tenant_id: string;
    role: string;
    tempPassword?: string;
  }) => Promise<void>;
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

export default function CreateStandaloneUserModal({
  isOpen,
  onClose,
  onSuccess
}: CreateStandaloneUserModalProps) {
  const { profile } = useAuth();
  const { createUser, loading } = useUserManagement();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    id_number: '',
    tenant_id: '',
    role: 'CITIZEN'
  });
  const [tempPassword, setTempPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTenants();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        id_number: '',
        tenant_id: '',
        role: 'CITIZEN'
      });
      setTempPassword('');
      setSuccessMessage('');
      setErrorMessage('');
      setCopied(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!formData.full_name || !formData.email || !formData.phone || !formData.id_number || !formData.tenant_id) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    try {
      setErrorMessage('');
      const result = await createUser({
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone,
        id_number: formData.id_number,
        tenant_id: formData.tenant_id,
        role: formData.role
      });

      setTempPassword(result.tempPassword);
      setSuccessMessage(`Successfully created user account for ${formData.full_name}`);
      
      await onSuccess({
        ...formData,
        tempPassword: result.tempPassword
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Create New User</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold">{successMessage}</p>
              {tempPassword && (
                <div className="mt-3 p-3 bg-white rounded border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Temporary Password:</p>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="text-sm text-green-600 hover:text-green-700 font-semibold"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200">
                    {tempPassword}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Please share this password with the user. They will be required to change it on first login.
                  </p>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{errorMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Number <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.id_number}
                onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                County/Tenant <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.tenant_id}
                onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
                required
              >
                <option value="">Select County/Tenant</option>
                {tenants.map(tenant => (
                  <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
                required
              >
                {USER_ROLES.map(role => (
                  <option key={role} value={role}>{role.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !!tempPassword}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? 'Creating...' : tempPassword ? 'User Created' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

