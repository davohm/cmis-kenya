import { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, CreditCard, Building2, User, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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

interface MemberDetailProps {
  memberId: string;
  onBack: () => void;
  role: string;
}

export default function MemberDetail({ memberId, onBack, role }: MemberDetailProps) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    shares_owned: 0,
    share_value: 0,
    is_active: true
  });

  useEffect(() => {
    loadMember();
  }, [memberId]);

  const loadMember = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cooperative_members')
        .select(`
          *,
          cooperatives (
            name,
            registration_number
          )
        `)
        .eq('id', memberId)
        .single();

      if (error) throw error;
      setMember(data);
      setFormData({
        full_name: data.full_name,
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        shares_owned: data.shares_owned,
        share_value: Number(data.share_value),
        is_active: data.is_active
      });
    } catch (error) {
      console.error('Error loading member:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cooperative_members')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          shares_owned: formData.shares_owned,
          share_value: formData.share_value,
          is_active: formData.is_active
        })
        .eq('id', memberId);

      if (error) throw error;

      await loadMember();
      setEditing(false);
    } catch (error) {
      console.error('Error updating member:', error);
      alert('Failed to update member');
    } finally {
      setSaving(false);
    }
  };

  const canEdit = role === 'COOPERATIVE_ADMIN' || role === 'SUPER_ADMIN' || role === 'COUNTY_ADMIN';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading member details...</div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Member not found</p>
        <button onClick={onBack} className="mt-4 text-red-600 hover:text-red-700">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{member.full_name}</h2>
            <p className="text-gray-600">Member #{member.member_number}</p>
          </div>
        </div>
        {canEdit && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Edit className="h-5 w-5" />
            Edit Member
          </button>
        )}
        {editing && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="h-5 w-5" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div>
        {editing ? (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm font-medium text-gray-700">Active Member</span>
          </label>
        ) : (
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
            member.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {member.is_active ? 'Active' : 'Inactive'}
          </span>
        )}
      </div>

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-red-600" />
            Personal Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Full Name</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              ) : (
                <p className="mt-1 text-gray-900">{member.full_name}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">ID Number</label>
              <p className="mt-1 text-gray-900">{member.id_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Member Number</label>
              <p className="mt-1 text-gray-900">{member.member_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Joined
              </label>
              <p className="mt-1 text-gray-900">{new Date(member.date_joined).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="h-5 w-5 text-red-600" />
            Contact Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="+254..."
                />
              ) : (
                <p className="mt-1 text-gray-900">{member.phone || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </label>
              {editing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
              ) : (
                <p className="mt-1 text-gray-900">{member.email || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </label>
              {editing ? (
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                  placeholder="Physical address..."
                />
              ) : (
                <p className="mt-1 text-gray-900">{member.address || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Cooperative Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-red-600" />
            Cooperative
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Cooperative Name</label>
              <p className="mt-1 text-gray-900">{member.cooperatives.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Registration Number</label>
              <p className="mt-1 text-gray-900">{member.cooperatives.registration_number}</p>
            </div>
          </div>
        </div>

        {/* Shares Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-red-600" />
            Shares & Contributions
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Shares Owned</label>
              {editing ? (
                <input
                  type="number"
                  value={formData.shares_owned}
                  onChange={(e) => setFormData({ ...formData, shares_owned: parseInt(e.target.value) || 0 })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  min="0"
                />
              ) : (
                <p className="mt-1 text-2xl font-bold text-gray-900">{member.shares_owned.toLocaleString()}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Share Value (KES)</label>
              {editing ? (
                <input
                  type="number"
                  value={formData.share_value}
                  onChange={(e) => setFormData({ ...formData, share_value: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              ) : (
                <p className="mt-1 text-2xl font-bold text-gray-900">KES {Number(member.share_value).toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
