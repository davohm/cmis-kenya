import { X, User, Mail, Phone, CreditCard, MapPin, Shield, Key, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCreateUser } from '../../hooks/useCountyManagement';
import { useAuth } from '../../contexts/AuthContext';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  countyId: string;
  countyName: string;
  preselectedRole?: 'COUNTY_ADMIN' | 'COUNTY_OFFICER' | 'CITIZEN';
  onSuccess: () => void;
}

export default function CreateUserModal({
  isOpen,
  onClose,
  countyId,
  countyName,
  preselectedRole,
  onSuccess
}: CreateUserModalProps) {
  const { profile } = useAuth();
  const { createUser, loading } = useCreateUser();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    id_number: '',
    role: preselectedRole || 'CITIZEN' as 'COUNTY_ADMIN' | 'COUNTY_OFFICER' | 'CITIZEN'
  });
  const [tempPassword, setTempPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        id_number: '',
        role: preselectedRole || 'CITIZEN'
      });
      setTempPassword('');
      setSuccessMessage('');
      setErrorMessage('');
      setCopied(false);
    }
  }, [isOpen, preselectedRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!formData.full_name || !formData.email || !formData.phone || !formData.id_number) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    try {
      setErrorMessage('');
      const result = await createUser({
        ...formData,
        county_id: countyId,
        assigned_by: profile.id
      });

      setTempPassword(result.tempPassword);
      setSuccessMessage(`Successfully created user account for ${formData.full_name}`);
      
      setTimeout(() => {
        onSuccess();
        if (!result.tempPassword) {
          onClose();
        }
      }, 5000);
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
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-700 to-green-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Create New User</h2>
            <p className="text-green-100 text-sm mt-1">{countyName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-green-900 p-2 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-semibold">{successMessage}</p>
              {tempPassword && (
                <div className="mt-3 p-3 bg-white rounded border border-green-200">
                  <p className="text-sm text-gray-600 mb-2">Temporary Password (share with user):</p>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono">
                      {tempPassword}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      title="Copy password"
                    >
                      {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-2" />
                Full Name *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter full name"
                required
                disabled={loading || !!tempPassword}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-2" />
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="user@example.com"
                required
                disabled={loading || !!tempPassword}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Phone className="inline h-4 w-4 mr-2" />
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="+254 700 000 000"
                required
                disabled={loading || !!tempPassword}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <CreditCard className="inline h-4 w-4 mr-2" />
                ID Number *
              </label>
              <input
                type="text"
                value={formData.id_number}
                onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter ID number"
                required
                disabled={loading || !!tempPassword}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-2" />
                County
              </label>
              <input
                type="text"
                value={countyName}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Shield className="inline h-4 w-4 mr-2" />
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
                disabled={loading || !!tempPassword}
              >
                <option value="COUNTY_ADMIN">County Admin</option>
                <option value="COUNTY_OFFICER">County Officer</option>
                <option value="CITIZEN">Citizen</option>
              </select>
            </div>

            {!tempPassword && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Key className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">Temporary Password</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      A temporary password will be automatically generated. Please share it securely with the user.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            type="button"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
          >
            {tempPassword ? 'Close' : 'Cancel'}
          </button>
          {!tempPassword && (
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:bg-gray-400 transition-colors font-semibold"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
