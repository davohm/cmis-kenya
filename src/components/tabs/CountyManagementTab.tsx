import { MapPin, Building2, Users, Shield, TrendingUp, Search, ArrowLeft, UserPlus, Plus, Trash2, AlertTriangle, Edit } from 'lucide-react';
import { useState } from 'react';
import { useCounties, useCountyDetails, useRemoveCountyRole, County } from '../../hooks/useCountyManagement';
import { useCountyCRUD } from '../../hooks/useCountyCRUD';
import AssignCountyAdminModal from '../admin/AssignCountyAdminModal';
import CreateUserModal from '../admin/CreateUserModal';
import CreateCountyModal from '../admin/CreateCountyModal';
import EditCountyModal from '../admin/EditCountyModal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  userName: string;
  isLoading: boolean;
}

function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, userName, isLoading }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-2">{message}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
              <p className="text-sm text-red-800">
                <strong>User:</strong> {userName}
              </p>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              This action cannot be undone. The user will lose access to this county's data.
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
            >
              {isLoading ? 'Removing...' : 'Remove Role'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CountyManagementTab() {
  const [selectedCountyId, setSelectedCountyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'COUNTY_ADMIN' | 'COUNTY_OFFICER'>('COUNTY_ADMIN');
  const [showCreateCountyModal, setShowCreateCountyModal] = useState(false);
  const [showEditCountyModal, setShowEditCountyModal] = useState(false);
  const [editingCounty, setEditingCounty] = useState<County | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    roleId: string;
    userName: string;
  }>({
    isOpen: false,
    roleId: '',
    userName: ''
  });
  const [deleteCountyDialog, setDeleteCountyDialog] = useState<{
    isOpen: boolean;
    countyId: string;
    countyName: string;
  }>({
    isOpen: false,
    countyId: '',
    countyName: ''
  });
  
  const { counties, loading: countiesLoading, refetch: refetchCounties } = useCounties();
  const { countyDetails, loading: detailsLoading, refetch: refetchDetails } = useCountyDetails(selectedCountyId);
  const { removeRole, loading: removeLoading } = useRemoveCountyRole();
  const { deleteCounty, loading: deleteLoading } = useCountyCRUD();

  const selectedCounty = counties.find(c => c.id === selectedCountyId);

  const filteredCounties = counties.filter(county =>
    county.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    county.county_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignRole = (role: 'COUNTY_ADMIN' | 'COUNTY_OFFICER') => {
    setSelectedRole(role);
    setShowAssignModal(true);
  };

  const handleCreateUser = (role: 'COUNTY_ADMIN' | 'COUNTY_OFFICER') => {
    setSelectedRole(role);
    setShowCreateModal(true);
  };

  const handleRemoveRole = (roleId: string, userName: string) => {
    setConfirmDialog({
      isOpen: true,
      roleId,
      userName
    });
  };

  const confirmRemoveRole = async () => {
    try {
      await removeRole(confirmDialog.roleId);
      refetchDetails();
      setConfirmDialog({ isOpen: false, roleId: '', userName: '' });
    } catch (err) {
      alert('Failed to remove role');
    }
  };

  const handleSuccess = () => {
    refetchCounties();
    refetchDetails();
  };

  const handleEditCounty = (e: React.MouseEvent, county: County) => {
    e.stopPropagation();
    setEditingCounty(county);
    setShowEditCountyModal(true);
  };

  const handleDeleteCounty = (e: React.MouseEvent, countyId: string, countyName: string) => {
    e.stopPropagation();
    setDeleteCountyDialog({
      isOpen: true,
      countyId,
      countyName
    });
  };

  const confirmDeleteCounty = async () => {
    try {
      await deleteCounty(deleteCountyDialog.countyId);
      refetchCounties();
      setDeleteCountyDialog({ isOpen: false, countyId: '', countyName: '' });
    } catch (err) {
      alert('Failed to deactivate county');
    }
  };

  if (selectedCountyId && countyDetails) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedCountyId(null)}
            className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-semibold"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Counties</span>
          </button>
        </div>

        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">{countyDetails.name}</h2>
              <p className="text-red-100">County Code: {countyDetails.county_code}</p>
              {countyDetails.contact_email && (
                <p className="text-red-100 mt-1">{countyDetails.contact_email}</p>
              )}
            </div>
            <div className={`px-4 py-2 rounded-full ${
              countyDetails.is_active ? 'bg-green-500' : 'bg-gray-500'
            }`}>
              {countyDetails.is_active ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="h-8 w-8 text-red-600" />
              <span className="text-3xl font-bold text-gray-900">
                {countyDetails.stats?.cooperatives || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600">Total Cooperatives</p>
            <p className="text-xs text-green-600 mt-1">
              {countyDetails.stats?.active_cooperatives || 0} active
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="h-8 w-8 text-green-700" />
              <span className="text-3xl font-bold text-gray-900">
                {countyDetails.stats?.county_admins || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600">County Admins</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 text-gray-700" />
              <span className="text-3xl font-bold text-gray-900">
                {countyDetails.stats?.county_officers || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600">County Officers</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 text-yellow-600" />
              <span className="text-3xl font-bold text-gray-900">
                {countyDetails.stats?.pending_applications || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600">Pending Apps</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">County Admins</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAssignRole('COUNTY_ADMIN')}
                    className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Assign Existing</span>
                  </button>
                  <button
                    onClick={() => handleCreateUser('COUNTY_ADMIN')}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors text-sm font-semibold"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create New</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              {detailsLoading ? (
                <p className="text-gray-500 text-center py-4">Loading...</p>
              ) : countyDetails.admins.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No county admins assigned</p>
              ) : (
                <div className="space-y-3">
                  {countyDetails.admins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="bg-red-100 p-2 rounded-lg">
                          <Shield className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{admin.user.full_name}</p>
                          <p className="text-sm text-gray-600">{admin.user.email}</p>
                          {admin.user.phone && (
                            <p className="text-xs text-gray-500">{admin.user.phone}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveRole(admin.id, admin.user.full_name)}
                        disabled={removeLoading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove role"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">County Officers</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAssignRole('COUNTY_OFFICER')}
                    className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Assign Existing</span>
                  </button>
                  <button
                    onClick={() => handleCreateUser('COUNTY_OFFICER')}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors text-sm font-semibold"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create New</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              {detailsLoading ? (
                <p className="text-gray-500 text-center py-4">Loading...</p>
              ) : countyDetails.officers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No county officers assigned</p>
              ) : (
                <div className="space-y-3">
                  {countyDetails.officers.map((officer) => (
                    <div key={officer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gray-100 p-2 rounded-lg">
                          <Users className="h-5 w-5 text-gray-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{officer.user.full_name}</p>
                          <p className="text-sm text-gray-600">{officer.user.email}</p>
                          {officer.user.phone && (
                            <p className="text-xs text-gray-500">{officer.user.phone}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveRole(officer.id, officer.user.full_name)}
                        disabled={removeLoading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove role"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Recent Cooperatives</h3>
          </div>
          <div className="p-6">
            {countyDetails.cooperatives.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No cooperatives registered</p>
            ) : (
              <div className="space-y-3">
                {countyDetails.cooperatives.map((coop) => (
                  <div key={coop.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Building2 className="h-5 w-5 text-green-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{coop.name}</p>
                        <p className="text-sm text-gray-600">
                          {(coop.cooperative_types as any)?.category || 'N/A'}
                        </p>
                        {coop.registration_number && (
                          <p className="text-xs text-gray-500">Reg: {coop.registration_number}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      coop.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {coop.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedCounty && (
          <>
            <AssignCountyAdminModal
              isOpen={showAssignModal}
              onClose={() => setShowAssignModal(false)}
              countyId={selectedCounty.id}
              countyName={selectedCounty.name}
              role={selectedRole}
              onSuccess={handleSuccess}
            />
            <CreateUserModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              countyId={selectedCounty.id}
              countyName={selectedCounty.name}
              preselectedRole={selectedRole}
              onSuccess={handleSuccess}
            />
          </>
        )}
        
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog({ isOpen: false, roleId: '', userName: '' })}
          onConfirm={confirmRemoveRole}
          title="Remove County Role"
          message="Are you sure you want to remove this role assignment?"
          userName={confirmDialog.userName}
          isLoading={removeLoading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">County Management</h2>
          <p className="text-gray-600">Manage all 47 counties and assign administrators</p>
        </div>
        <button
          onClick={() => setShowCreateCountyModal(true)}
          className="flex items-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
        >
          <Plus className="h-5 w-5" />
          <span>Create New County</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search counties by name or code..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
      </div>

      {countiesLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading counties...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCounties.map((county) => (
            <div
              key={county.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-red-300 transition-all relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="flex items-center space-x-3 cursor-pointer flex-1"
                  onClick={() => setSelectedCountyId(county.id)}
                >
                  <div className="bg-red-100 p-3 rounded-lg">
                    <MapPin className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{county.name}</h3>
                    <p className="text-sm text-gray-600">Code: {county.county_code}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleEditCounty(e, county)}
                    className="p-2 text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                    title="Edit county"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteCounty(e, county.id, county.name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Deactivate county"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className={`w-3 h-3 rounded-full ${
                    county.is_active ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
              </div>

              <div 
                className="grid grid-cols-2 gap-4 cursor-pointer"
                onClick={() => setSelectedCountyId(county.id)}
              >
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {county.stats?.cooperatives || 0}
                  </p>
                  <p className="text-xs text-gray-600">Cooperatives</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {county.stats?.pending_applications || 0}
                  </p>
                  <p className="text-xs text-gray-600">Pending Apps</p>
                </div>
              </div>

              <div 
                className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm cursor-pointer"
                onClick={() => setSelectedCountyId(county.id)}
              >
                <div className="flex items-center space-x-2 text-gray-600">
                  <Shield className="h-4 w-4" />
                  <span>{county.stats?.county_admins || 0} Admins</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{county.stats?.county_officers || 0} Officers</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateCountyModal
        isOpen={showCreateCountyModal}
        onClose={() => setShowCreateCountyModal(false)}
        onSuccess={() => {
          refetchCounties();
          setShowCreateCountyModal(false);
        }}
      />

      <EditCountyModal
        isOpen={showEditCountyModal}
        onClose={() => {
          setShowEditCountyModal(false);
          setEditingCounty(null);
        }}
        county={editingCounty}
        onSuccess={() => {
          refetchCounties();
          if (selectedCountyId === editingCounty?.id) {
            refetchDetails();
          }
          setShowEditCountyModal(false);
          setEditingCounty(null);
        }}
      />

      <ConfirmDialog
        isOpen={deleteCountyDialog.isOpen}
        onClose={() => setDeleteCountyDialog({ isOpen: false, countyId: '', countyName: '' })}
        onConfirm={confirmDeleteCounty}
        title="Deactivate County"
        message={`Are you sure you want to deactivate this county? This will set the county to inactive status.`}
        userName={deleteCountyDialog.countyName}
        isLoading={deleteLoading}
      />
    </div>
  );
}
