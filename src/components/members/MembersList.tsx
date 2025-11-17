import { useState, useEffect } from 'react';
import { Search, Plus, Users, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AddMemberModal from './AddMemberModal';

interface Member {
  id: string;
  cooperative_id: string;
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
  cooperatives: {
    name: string;
    registration_number: string;
  };
}

interface MembersListProps {
  role: string;
  tenantId?: string;
  cooperativeId?: string;
  onSelectMember: (memberId: string) => void;
}

export default function MembersList({ role, tenantId, cooperativeId, onSelectMember }: MembersListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cooperatives, setCooperatives] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCoopFilter, setSelectedCoopFilter] = useState<string>('all');

  useEffect(() => {
    loadMembers();
    if (role === 'SUPER_ADMIN' || role === 'COUNTY_ADMIN') {
      loadCooperatives();
    }
  }, [role, tenantId, cooperativeId]);

  useEffect(() => {
    filterMembers();
  }, [members, searchTerm, statusFilter, selectedCoopFilter]);

  const loadCooperatives = async () => {
    let query = supabase
      .from('cooperatives')
      .select('id, name, registration_number')
      .eq('is_active', true)
      .order('name');

    if (role === 'COUNTY_ADMIN' && tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data } = await query;
    setCooperatives(data || []);
  };

  const loadMembers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('cooperative_members')
        .select(`
          *,
          cooperatives (
            name,
            registration_number,
            tenant_id
          )
        `)
        .order('date_joined', { ascending: false });

      // Filter based on role
      if (cooperativeId) {
        query = query.eq('cooperative_id', cooperativeId);
      } else if (role === 'COUNTY_ADMIN' && tenantId) {
        // For county admin, get members from cooperatives in their county
        const { data: coopIds } = await supabase
          .from('cooperatives')
          .select('id')
          .eq('tenant_id', tenantId);
        
        if (coopIds && coopIds.length > 0) {
          query = query.in('cooperative_id', coopIds.map(c => c.id));
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = [...members];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (member) =>
          member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.member_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.id_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.phone?.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((member) => 
        statusFilter === 'active' ? member.is_active : !member.is_active
      );
    }

    // Cooperative filter
    if (selectedCoopFilter !== 'all') {
      filtered = filtered.filter((member) => member.cooperative_id === selectedCoopFilter);
    }

    setFilteredMembers(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Member Number', 'Full Name', 'ID Number', 'Phone', 'Email', 'Cooperative', 'Shares Owned', 'Share Value', 'Date Joined', 'Status'];
    const rows = filteredMembers.map(m => [
      m.member_number,
      m.full_name,
      m.id_number,
      m.phone || '',
      m.email || '',
      m.cooperatives.name,
      m.shares_owned,
      m.share_value,
      new Date(m.date_joined).toLocaleDateString(),
      m.is_active ? 'Active' : 'Inactive'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const canAddMember = role === 'COOPERATIVE_ADMIN' || role === 'SUPER_ADMIN' || role === 'COUNTY_ADMIN';

  const totalShares = filteredMembers.reduce((sum, m) => sum + m.shares_owned, 0);
  const totalShareValue = filteredMembers.reduce((sum, m) => sum + Number(m.share_value), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading members...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Members Management</h2>
          <p className="text-gray-600 mt-1">
            {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-5 w-5" />
            Export CSV
          </button>
          {canAddMember && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Member
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Users className="h-10 w-10 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{filteredMembers.filter(m => m.is_active).length}</p>
              <p className="text-sm text-gray-600">Active Members</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Shares</p>
          <p className="text-2xl font-bold text-gray-900">{totalShares.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Share Value</p>
          <p className="text-2xl font-bold text-gray-900">KES {totalShareValue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Inactive Members</p>
          <p className="text-2xl font-bold text-gray-900">{filteredMembers.filter(m => !m.is_active).length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, member number, ID, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          {(role === 'SUPER_ADMIN' || role === 'COUNTY_ADMIN') && cooperatives.length > 0 && (
            <select
              value={selectedCoopFilter}
              onChange={(e) => setSelectedCoopFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent min-w-[200px]"
            >
              <option value="all">All Cooperatives</option>
              {cooperatives.map((coop) => (
                <option key={coop.id} value={coop.id}>{coop.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cooperative</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No members found
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    onClick={() => onSelectMember(member.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{member.full_name}</p>
                        <p className="text-sm text-gray-600">
                          #{member.member_number} • ID: {member.id_number}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{member.cooperatives.name}</p>
                        <p className="text-sm text-gray-600">{member.cooperatives.registration_number}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900">{member.phone || 'N/A'}</p>
                        <p className="text-gray-600">{member.email || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{member.shares_owned.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">KES {Number(member.share_value).toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(member.date_joined).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddMemberModal
          cooperativeId={cooperativeId}
          cooperatives={cooperatives}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadMembers();
          }}
        />
      )}
    </div>
  );
}
