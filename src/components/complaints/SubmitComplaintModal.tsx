import { useState, useEffect } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ComplaintCategory, ComplaintPriority } from '../../hooks/useComplaints';

interface SubmitComplaintModalProps {
  cooperativeId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubmitComplaintModal({ cooperativeId, onClose, onSuccess }: SubmitComplaintModalProps) {
  const { profile } = useAuth();
  const [cooperatives, setCooperatives] = useState<Array<{ id: string; name: string; registration_number: string }>>([]);
  const [formData, setFormData] = useState({
    cooperative_id: cooperativeId || '',
    subject: '',
    description: '',
    complaint_category: '' as ComplaintCategory | '',
    priority: 'MEDIUM' as ComplaintPriority,
    is_anonymous: false,
    contact_email: profile?.email || '',
    contact_phone: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<string[]>([]);

  useEffect(() => {
    if (!cooperativeId) {
      loadCooperatives();
    }
  }, [cooperativeId]);

  const loadCooperatives = async () => {
    const { data } = await supabase
      .from('cooperatives')
      .select('id, name, registration_number')
      .eq('is_active', true)
      .order('name');

    setCooperatives(data || []);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const timestamp = Date.now();
      const fileName = `complaints/${timestamp}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('registration-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setEvidenceFiles([...evidenceFiles, fileName]);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.cooperative_id || !formData.subject || !formData.description || !formData.complaint_category) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Generate complaint number
      const year = new Date().getFullYear();
      const complaintNumber = `CPL-${year}-${Date.now().toString().slice(-6)}`;

      // Insert complaint
      const { error: insertError } = await supabase
        .from('inquiry_requests')
        .insert({
          inquiry_number: complaintNumber,
          cooperative_id: formData.cooperative_id,
          requester_user_id: formData.is_anonymous ? null : profile?.id,
          requester_name: formData.is_anonymous ? 'Anonymous' : profile?.full_name || 'Unknown',
          requester_email: formData.contact_email,
          requester_phone: formData.is_anonymous ? null : formData.contact_phone,
          subject: formData.subject,
          description: formData.description,
          complaint_category: formData.complaint_category,
          priority: formData.priority,
          complaint_status: 'RECEIVED',
          is_anonymous: formData.is_anonymous,
          evidence_documents: evidenceFiles.length > 0 ? evidenceFiles : null,
          created_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      onSuccess();
    } catch (err: any) {
      console.error('Error submitting complaint:', err);
      setError(err.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions: { value: ComplaintCategory; label: string }[] = [
    { value: 'GOVERNANCE', label: 'Governance Issues' },
    { value: 'FINANCIAL_MISMANAGEMENT', label: 'Financial Mismanagement' },
    { value: 'MEMBER_DISPUTE', label: 'Member Dispute' },
    { value: 'SERVICE_DELIVERY', label: 'Service Delivery' },
    { value: 'FRAUD', label: 'Fraud' },
    { value: 'CORRUPTION', label: 'Corruption' },
    { value: 'OTHER', label: 'Other' }
  ];

  const priorityOptions: { value: ComplaintPriority; label: string; color: string }[] = [
    { value: 'LOW', label: 'Low Priority', color: 'text-blue-600' },
    { value: 'MEDIUM', label: 'Medium Priority', color: 'text-yellow-600' },
    { value: 'HIGH', label: 'High Priority', color: 'text-orange-600' },
    { value: 'URGENT', label: 'Urgent', color: 'text-red-600' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">File a Complaint</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Anonymous Complaint Option */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_anonymous}
                onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500 h-5 w-5"
              />
              <div>
                <div className="font-medium text-gray-900">File Anonymous Complaint</div>
                <div className="text-sm text-gray-600">Your identity will be protected</div>
              </div>
            </label>
          </div>

          {/* Cooperative Selection */}
          {!cooperativeId && (
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
                  <option key={coop.id} value={coop.id}>
                    {coop.name} ({coop.registration_number})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Complaint Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.complaint_category}
              onChange={(e) => setFormData({ ...formData, complaint_category: e.target.value as ComplaintCategory })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            >
              <option value="">Select a category</option>
              {categoryOptions.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority Level <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as ComplaintPriority })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            >
              {priorityOptions.map((priority) => (
                <option key={priority.value} value={priority.value} className={priority.color}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject/Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Brief summary of the complaint"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Provide detailed information about your complaint..."
              required
            />
          </div>

          {/* Contact Information (if not anonymous) */}
          {!formData.is_anonymous && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="+254..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Evidence Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Evidence/Supporting Documents
            </label>
            <div className="mt-2">
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 cursor-pointer transition-colors">
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {uploading ? 'Uploading...' : 'Upload Documents/Photos'}
                </span>
                <input
                  type="file"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  disabled={uploading}
                />
              </label>
              {evidenceFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {evidenceFiles.map((file, idx) => (
                    <div key={idx} className="text-sm text-green-600 flex items-center gap-2">
                      <span>✓</span>
                      <span>{file.split('/').pop()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading || uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              disabled={loading || uploading}
            >
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
