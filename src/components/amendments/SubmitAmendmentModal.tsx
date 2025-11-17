import { useState, useEffect } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useDocumentUpload } from '../../hooks/useDocumentUpload';
import { AmendmentType } from '../../hooks/useAmendmentRequests';
import PaymentGatewayModal from '../integrations/PaymentGatewayModal';
import { SERVICE_FEES } from '../../services/mockIntegrations';

interface SubmitAmendmentModalProps {
  cooperativeId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubmitAmendmentModal({ cooperativeId, onClose, onSuccess }: SubmitAmendmentModalProps) {
  const { profile } = useAuth();
  const { uploadDocument, uploading } = useDocumentUpload();
  const [cooperatives, setCooperatives] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCooperative, setSelectedCooperative] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    cooperative_id: cooperativeId || '',
    amendment_type: '' as AmendmentType | '',
    current_value: '',
    proposed_value: '',
    reason: ''
  });

  const [supportingDocPath, setSupportingDocPath] = useState('');
  const [resolutionMinutesPath, setResolutionMinutesPath] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingAmendmentId, setPendingAmendmentId] = useState<string | null>(null);

  useEffect(() => {
    if (!cooperativeId) {
      loadCooperatives();
    } else {
      loadCooperativeInfo(cooperativeId);
    }
  }, [cooperativeId]);

  useEffect(() => {
    if (formData.cooperative_id && !cooperativeId) {
      loadCooperativeInfo(formData.cooperative_id);
    }
  }, [formData.cooperative_id]);

  useEffect(() => {
    if (selectedCooperative && formData.amendment_type) {
      updateCurrentValue();
    }
  }, [formData.amendment_type, selectedCooperative]);

  const loadCooperatives = async () => {
    let query = supabase
      .from('cooperatives')
      .select('id, name, registration_number, address, email, phone')
      .eq('is_active', true);

    if (profile?.tenant_id) {
      query = query.eq('tenant_id', profile.tenant_id);
    }

    const { data } = await query;
    setCooperatives(data || []);
  };

  const loadCooperativeInfo = async (coopId: string) => {
    const { data } = await supabase
      .from('cooperatives')
      .select('*')
      .eq('id', coopId)
      .single();

    if (data) {
      setSelectedCooperative(data);
    }
  };

  const updateCurrentValue = () => {
    if (!selectedCooperative) return;

    switch (formData.amendment_type) {
      case 'NAME_CHANGE':
        setFormData(prev => ({ ...prev, current_value: selectedCooperative.name || '' }));
        break;
      case 'ADDRESS_CHANGE':
        setFormData(prev => ({ ...prev, current_value: selectedCooperative.address || '' }));
        break;
      case 'OFFICIAL_CHANGE':
        setFormData(prev => ({ ...prev, current_value: 'Current officials list' }));
        break;
      case 'BYLAW_AMENDMENT':
        setFormData(prev => ({ ...prev, current_value: 'Current bylaws' }));
        break;
      case 'MEMBERSHIP_RULES':
        setFormData(prev => ({ ...prev, current_value: 'Current membership rules' }));
        break;
      case 'SHARE_CAPITAL_CHANGE':
        setFormData(prev => ({ 
          ...prev, 
          current_value: `KES ${selectedCooperative.total_share_capital?.toLocaleString() || '0'}` 
        }));
        break;
      default:
        setFormData(prev => ({ ...prev, current_value: '' }));
    }
  };

  const handleFileUpload = async (file: File, type: 'supporting' | 'minutes') => {
    try {
      if (!formData.cooperative_id) {
        setError('Please select a cooperative first');
        return;
      }

      const result = await uploadDocument(file, formData.cooperative_id, 'bylaws');
      if (result.path) {
        if (type === 'supporting') {
          setSupportingDocPath(result.path);
        } else {
          setResolutionMinutesPath(result.path);
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload document');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.cooperative_id || !formData.amendment_type || !formData.proposed_value || !formData.reason) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (!profile?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      const requestNumber = `AMD-${Date.now().toString().slice(-8)}`;

      const { data: amendmentData, error: insertError } = await supabase
        .from('amendment_requests')
        .insert({
          request_number: requestNumber,
          cooperative_id: formData.cooperative_id,
          amendment_type: formData.amendment_type,
          current_value: formData.current_value,
          proposed_value: formData.proposed_value,
          reason: formData.reason,
          supporting_documents_url: supportingDocPath || null,
          resolution_minutes_url: resolutionMinutesPath || null,
          status: 'PENDING_PAYMENT',
          submitted_by: profile.id,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setPendingAmendmentId(amendmentData.id);
      setShowPaymentModal(true);
    } catch (err: any) {
      console.error('Error submitting amendment:', err);
      setError(err.message || 'Failed to submit amendment request');
    } finally {
      setLoading(false);
    }
  };

  const amendmentTypes: { value: AmendmentType; label: string }[] = [
    { value: 'BYLAW_AMENDMENT', label: 'Bylaw Amendment' },
    { value: 'NAME_CHANGE', label: 'Name Change' },
    { value: 'ADDRESS_CHANGE', label: 'Address Change' },
    { value: 'OFFICIAL_CHANGE', label: 'Official Change' },
    { value: 'MEMBERSHIP_RULES', label: 'Membership Rules' },
    { value: 'SHARE_CAPITAL_CHANGE', label: 'Share Capital Change' },
    { value: 'OTHER', label: 'Other' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Submit Amendment Request</h3>
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
                  <option key={coop.id} value={coop.id}>{coop.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Amendment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amendment Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.amendment_type}
              onChange={(e) => setFormData({ ...formData, amendment_type: e.target.value as AmendmentType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            >
              <option value="">Select amendment type</option>
              {amendmentTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Current vs Proposed Changes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Value
              </label>
              <textarea
                value={formData.current_value}
                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50"
                rows={4}
                placeholder="Current value will be auto-filled based on amendment type"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proposed Value <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.proposed_value}
                onChange={(e) => setFormData({ ...formData, proposed_value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={4}
                placeholder="Enter the proposed new value"
                required
              />
            </div>
          </div>

          {/* Justification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Justification / Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={4}
              placeholder="Provide a detailed justification for this amendment"
              required
            />
          </div>

          {/* Document Uploads */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Supporting Documents</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supporting Documents
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {supportingDocPath ? 'Document uploaded ✓' : 'Choose file'}
                  </span>
                  <input
                    type="file"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'supporting')}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    disabled={uploading}
                  />
                </label>
                {supportingDocPath && (
                  <FileText className="h-5 w-5 text-green-600" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resolution Minutes
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {resolutionMinutesPath ? 'Minutes uploaded ✓' : 'Choose file'}
                  </span>
                  <input
                    type="file"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'minutes')}
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    disabled={uploading}
                  />
                </label>
                {resolutionMinutesPath && (
                  <FileText className="h-5 w-5 text-green-600" />
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
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
              {loading ? 'Submitting...' : 'Submit Amendment Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
