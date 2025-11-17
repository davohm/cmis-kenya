import { X, Search, User, MapPin, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchUsers, useAssignCountyRole, UserSearchResult } from '../../hooks/useCountyManagement';
import { useAuth } from '../../contexts/AuthContext';

interface AssignCountyAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  countyId: string;
  countyName: string;
  role: 'COUNTY_ADMIN' | 'COUNTY_OFFICER';
  onSuccess: () => void;
}

export default function AssignCountyAdminModal({
  isOpen,
  onClose,
  countyId,
  countyName,
  role,
  onSuccess
}: AssignCountyAdminModalProps) {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const { searchUsers, loading: searchLoading } = useSearchUsers();
  const { assignRole, loading: assignLoading } = useAssignCountyRole();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setSelectedUser(null);
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (searchTerm.trim().length < 2) {
      setErrorMessage('Please enter at least 2 characters to search');
      return;
    }

    setErrorMessage('');
    const results = await searchUsers(searchTerm);
    setSearchResults(results);
  };

  const handleAssign = async () => {
    if (!selectedUser || !profile) return;

    try {
      setErrorMessage('');
      await assignRole(selectedUser.id, countyId, role, profile.id);
      setSuccessMessage(`Successfully assigned ${selectedUser.full_name} as ${role.replace('_', ' ')} for ${countyName}`);
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to assign role');
    }
  };

  const hasRoleInCounty = (user: UserSearchResult) => {
    return user.existing_roles.some(r => r.tenant_id === countyId && r.role === role);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Assign {role === 'COUNTY_ADMIN' ? 'County Admin' : 'County Officer'}
            </h2>
            <p className="text-red-100 text-sm mt-1">{countyName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-red-800 p-2 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-semibold">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Users
              </label>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search by email or name..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors font-semibold"
                >
                  {searchLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Search Results</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((user) => {
                    const hasRole = hasRoleInCounty(user);
                    return (
                      <div
                        key={user.id}
                        onClick={() => !hasRole && setSelectedUser(user)}
                        className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          selectedUser?.id === user.id
                            ? 'border-red-600 bg-red-50'
                            : hasRole
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                            : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="bg-red-100 p-2 rounded-lg">
                              <User className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{user.full_name}</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              {user.phone && (
                                <p className="text-sm text-gray-500">{user.phone}</p>
                              )}
                              {user.id_number && (
                                <p className="text-xs text-gray-500">ID: {user.id_number}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {hasRole ? (
                              <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                                Already Assigned
                              </span>
                            ) : user.existing_roles.length > 0 ? (
                              <div className="space-y-1">
                                {user.existing_roles.map((r, idx) => (
                                  <div key={idx} className="flex items-center space-x-2 text-xs">
                                    <Shield className="h-3 w-3 text-gray-500" />
                                    <span className="text-gray-600">{r.role.replace('_', ' ')}</span>
                                    <MapPin className="h-3 w-3 text-gray-500" />
                                    <span className="text-gray-600">{r.tenant_name}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">No existing roles</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedUser && (
              <div className="bg-gradient-to-br from-red-50 to-green-50 p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected User</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-semibold text-gray-900">{selectedUser.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Assigning Role</p>
                      <p className="font-semibold text-gray-900">
                        {role === 'COUNTY_ADMIN' ? 'County Admin' : 'County Officer'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">County</p>
                      <p className="font-semibold text-gray-900">{countyName}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedUser || assignLoading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors font-semibold"
          >
            {assignLoading ? 'Assigning...' : 'Assign Role'}
          </button>
        </div>
      </div>
    </div>
  );
}
