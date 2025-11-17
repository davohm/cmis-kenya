import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AddMemberModalProps {
  cooperativeId?: string;
  cooperatives: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMemberModal({ cooperativeId, cooperatives, onClose, onSuccess }: AddMemberModalProps) {
  const [formData, setFormData] = useState({
    cooperative_id: cooperativeId || '',
    member_number: '',
    full_name: '',
    id_number: '',
    phone: '',
    email: '',
    address: '',
    shares_owned: 0,
    share_value: 0,
    date_joined: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.cooperative_id || !formData.member_number || !formData.full_name || !formData.id_number) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Check if member number already exists for this cooperative
      const { data: existing } = await supabase
        .from('cooperative_members')
        .select('id')
        .eq('cooperative_id', formData.cooperative_id)
        .eq('member_number', formData.member_number)
        .single();

      if (existing) {
        setError('A member with this member number already exists in this cooperative');
        setLoading(false);
        return;
      }

      // Insert new member
      const { error: insertError } = await supabase
        .from('cooperative_members')
        .insert({
          cooperative_id: formData.cooperative_id,
          member_number: formData.member_number,
          full_name: formData.full_name,
          id_number: formData.id_number,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          shares_owned: formData.shares_owned,
          share_value: formData.share_value,
          date_joined: formData.date_joined,
          is_active: true
        });

      if (insertError) throw insertError;

      // Update cooperative total members count
      const { data: members } = await supabase
        .from('cooperative_members')
        .select('id')
        .eq('cooperative_id', formData.cooperative_id)
        .eq('is_active', true);

      await supabase
        .from('cooperatives')
        .update({ total_members: members?.length || 0 })
        .eq('id', formData.cooperative_id);

      onSuccess();
    } catch (err: any) {
      console.error('Error adding member:', err);
      setError(err.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Add New Member</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Cooperative Selection */}
          {!cooperativeId && cooperatives.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cooperative <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.cooperative_id}
                onChange={(e) => setFormData({ ...formData, cooperative_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              >
                <option value="">Select a cooperative</option>
                {cooperatives.map((coop) => (
                  <option key={coop.id} value={coop.id}>{coop.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Member Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.member_number}
              onChange={(e) => setFormData({ ...formData, member_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="e.g., MEM001"
              required
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="John Doe"
              required
            />
          </div>

          {/* ID Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.id_number}
              onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="12345678"
              required
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="+254..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="email@example.com"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={3}
              placeholder="Physical address..."
            />
          </div>

          {/* Shares Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shares Owned</label>
              <input
                type="number"
                value={formData.shares_owned}
                onChange={(e) => setFormData({ ...formData, shares_owned: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Share Value (KES)</label>
              <input
                type="number"
                value={formData.share_value}
                onChange={(e) => setFormData({ ...formData, share_value: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Date Joined */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Joined <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date_joined}
              onChange={(e) => setFormData({ ...formData, date_joined: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
