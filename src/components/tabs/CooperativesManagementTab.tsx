import { Building2, Users, Search, Plus, Edit, Trash2, AlertTriangle, MapPin, FileText, CheckCircle, XCircle, Filter, Download, Archive, Calendar, TrendingUp } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useCooperativeCRUD, Tenant } from '../../hooks/useCooperativeCRUD';
import CreateCooperativeModal from '../admin/CreateCooperativeModal';
import EditCooperativeModal from '../admin/EditCooperativeModal';

interface Cooperative {
  id: string;
  name: string;
  registration_number: string | null;
  type_id: string | null;
  tenant_id: string;
  status: string;
  registration_date: string | null;
  address: string | null;
  postal_address: string | null;
  email: string | null;
  phone: string | null;
  total_members: number;
  total_share_capital: number;
  is_active: boolean;
  cooperative_types?: {
    id: string;
    name: string;
    category: string;
  };
  tenants?: {
    id: string;
    name: string;
  };
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  cooperativeName: string;
  isLoading: boolean;
}

function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, cooperativeName, isLoading }: ConfirmDialogProps) {
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
                <strong>Cooperative:</strong> {cooperativeName}
              </p>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              This action will deactivate the cooperative. It can be reactivated later if needed.
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
              {isLoading ? 'Deactivating...' : 'Deactivate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CooperativesManagementTab() {
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [counties, setCounties] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCooperatives, setSelectedCooperatives] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCooperative, setEditingCooperative] = useState<Cooperative | null>(null);
  const [cooperativeTypes, setCooperativeTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    cooperativeId: string;
    cooperativeName: string;
  }>({
    isOpen: false,
    cooperativeId: '',
    cooperativeName: ''
  });

  const { deleteCooperative, loading: deleteLoading, loadCounties } = useCooperativeCRUD();

  useEffect(() => {
    loadData();
    loadCooperativeTypes();
  }, []);

  const loadData = async () => {
    await Promise.all([loadCooperatives(), loadCountiesList()]);
  };

  const loadCooperatives = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('cooperatives')
        .select(`
          *,
          cooperative_types(id, name, category),
          tenants(id, name)
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setCooperatives(data || []);
    } catch (err) {
      console.error('Error loading cooperatives:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCountiesList = async () => {
    const countiesData = await loadCounties();
    setCounties(countiesData);
  };

  const loadCooperativeTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('cooperative_types')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCooperativeTypes(data || []);
    } catch (err) {
      console.error('Error loading cooperative types:', err);
    }
  };

  const handleSelectCooperative = (cooperativeId: string) => {
    setSelectedCooperatives(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cooperativeId)) {
        newSet.delete(cooperativeId);
      } else {
        newSet.add(cooperativeId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedCooperatives.size === filteredCooperatives.length) {
      setSelectedCooperatives(new Set());
    } else {
      setSelectedCooperatives(new Set(filteredCooperatives.map(c => c.id)));
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedCooperatives.size === 0) return;
    
    if (!confirm(`Are you sure you want to deactivate ${selectedCooperatives.size} cooperative(s)?`)) {
      return;
    }

    try {
      for (const coopId of selectedCooperatives) {
        await deleteCooperative(coopId);
      }
      setSelectedCooperatives(new Set());
      loadCooperatives();
    } catch (err) {
      console.error('Error deactivating cooperatives:', err);
      alert('Failed to deactivate some cooperatives');
    }
  };

  const handleExport = () => {
    const csv = [
      ['Name', 'Registration Number', 'Type', 'County', 'Status', 'Members', 'Share Capital', 'Email', 'Phone'].join(','),
      ...filteredCooperatives.map(coop => [
        coop.name,
        coop.registration_number || '',
        coop.cooperative_types?.name || '',
        coop.tenants?.name || '',
        coop.status,
        coop.total_members,
        coop.total_share_capital,
        coop.email || '',
        coop.phone || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cooperatives_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleEditCooperative = (cooperative: Cooperative) => {
    setEditingCooperative(cooperative);
    setShowEditModal(true);
  };

  const handleDeleteCooperative = (cooperativeId: string, cooperativeName: string) => {
    setConfirmDialog({
      isOpen: true,
      cooperativeId,
      cooperativeName
    });
  };

  const confirmDeleteCooperative = async () => {
    try {
      await deleteCooperative(confirmDialog.cooperativeId);
      loadCooperatives();
      setConfirmDialog({ isOpen: false, cooperativeId: '', cooperativeName: '' });
    } catch (err) {
      alert('Failed to deactivate cooperative');
    }
  };

  const handleSuccess = () => {
    loadCooperatives();
  };

  const filteredCooperatives = useMemo(() => {
    return cooperatives.filter(coop => {
      const matchesSearch = !searchTerm || 
        coop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (coop.registration_number && coop.registration_number.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCounty = !selectedCounty || coop.tenant_id === selectedCounty;
      const matchesStatus = !selectedStatus || coop.status === selectedStatus;
      const matchesType = !selectedType || coop.type_id === selectedType;
      
      let matchesDate = true;
      if (dateFrom || dateTo) {
        const regDate = coop.registration_date ? new Date(coop.registration_date) : null;
        if (dateFrom && regDate && regDate < new Date(dateFrom)) matchesDate = false;
        if (dateTo && regDate && regDate > new Date(dateTo)) matchesDate = false;
      }

      return matchesSearch && matchesCounty && matchesStatus && matchesType && matchesDate;
    });
  }, [cooperatives, searchTerm, selectedCounty, selectedStatus, selectedType, dateFrom, dateTo]);

  const stats = {
    total: cooperatives.length,
    active: cooperatives.filter(c => c.is_active).length,
    inactive: cooperatives.filter(c => !c.is_active).length
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { bg: string; text: string; label: string } } = {
      'REGISTERED': { bg: 'bg-green-100', text: 'text-green-700', label: 'Registered' },
      'ACTIVE': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Active' },
      'PENDING_REGISTRATION': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      'SUSPENDED': { bg: 'bg-red-100', text: 'text-red-700', label: 'Suspended' },
      'INACTIVE': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Inactive' }
    };

    const config = statusConfig[status] || statusConfig['INACTIVE'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cooperatives Management</h2>
          <p className="text-gray-600 mt-1">Manually create and manage cooperative societies</p>
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
          </button>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            <Plus className="h-5 w-5" />
            <span>Create Cooperative</span>
          </button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="h-8 w-8 text-red-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
          </div>
          <p className="text-sm text-gray-600">Total Cooperatives</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.active}</span>
          </div>
          <p className="text-sm text-gray-600">Active Cooperatives</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-8 w-8 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">
              {cooperatives.reduce((sum, c) => sum + c.total_members, 0).toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-600">Total Members</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <span className="text-3xl font-bold text-gray-900">
              KES {((cooperatives.reduce((sum, c) => sum + Number(c.total_share_capital || 0), 0)) / 1000000).toFixed(1)}M
            </span>
          </div>
          <p className="text-sm text-gray-600">Total Share Capital</p>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
            <button
              onClick={() => {
                setSelectedCounty('');
                setSelectedStatus('');
                setSelectedType('');
                setDateFrom('');
                setDateTo('');
                setShowFilters(false);
              }}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
              <select
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
              >
                <option value="">All Counties</option>
                {counties.map(county => (
                  <option key={county.id} value={county.id}>{county.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
              >
                <option value="">All Statuses</option>
                <option value="REGISTERED">Registered</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING_REGISTRATION">Pending</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
              >
                <option value="">All Types</option>
                {cooperativeTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* Search and Bulk Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search cooperatives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
              />
            </div>
          </div>
          {selectedCooperatives.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedCooperatives.size} selected
              </span>
              <button
                onClick={handleBulkDeactivate}
                disabled={deleteLoading}
                className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Archive className="h-4 w-4" />
                <span>Deactivate</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading cooperatives...</div>
          ) : filteredCooperatives.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No cooperatives found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCooperatives.size === filteredCooperatives.length && filteredCooperatives.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-600"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Cooperative
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Registration No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    County
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCooperatives.map((coop) => (
                  <tr key={coop.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCooperatives.has(coop.id)}
                        onChange={() => handleSelectCooperative(coop.id)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-600"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-red-100 p-2 rounded-lg">
                          <Building2 className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{coop.name}</p>
                          <p className="text-xs text-gray-500">{coop.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900 font-mono">
                          {coop.registration_number || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{coop.cooperative_types?.name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{coop.cooperative_types?.category}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{coop.tenants?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(coop.status)}
                        {!coop.is_active && (
                          <span className="text-xs text-gray-500">(Inactive)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{coop.total_members}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditCooperative(coop)}
                          className="p-2 text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit Cooperative"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCooperative(coop.id, coop.name)}
                          disabled={deleteLoading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Deactivate Cooperative"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CreateCooperativeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleSuccess}
      />

      <EditCooperativeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCooperative(null);
        }}
        cooperative={editingCooperative}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, cooperativeId: '', cooperativeName: '' })}
        onConfirm={confirmDeleteCooperative}
        title="Deactivate Cooperative"
        message="Are you sure you want to deactivate this cooperative?"
        cooperativeName={confirmDialog.cooperativeName}
        isLoading={deleteLoading}
      />
    </div>
  );
}
