import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Download, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';
import { AmendmentRequest } from '../../hooks/useAmendmentRequests';
import { useAuth } from '../../contexts/AuthContext';
import { useDocumentUpload } from '../../hooks/useDocumentUpload';

interface AmendmentDetailProps {
  amendment: AmendmentRequest;
  onBack: () => void;
  onApprove?: (amendmentId: string, reviewNotes: string) => Promise<void>;
  onReject?: (amendmentId: string, reviewNotes: string) => Promise<void>;
}

export default function AmendmentDetail({ amendment, onBack, onApprove, onReject }: AmendmentDetailProps) {
  const { profile } = useAuth();
  const { getSignedUrl } = useDocumentUpload();
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [supportingDocUrl, setSupportingDocUrl] = useState<string | null>(null);
  const [minutesUrl, setMinutesUrl] = useState<string | null>(null);

  useEffect(() => {
    loadDocumentUrls();
  }, [amendment]);

  const loadDocumentUrls = async () => {
    if (amendment.supporting_documents_url) {
      const url = await getSignedUrl(amendment.supporting_documents_url);
      setSupportingDocUrl(url);
    }
    if (amendment.resolution_minutes_url) {
      const url = await getSignedUrl(amendment.resolution_minutes_url);
      setMinutesUrl(url);
    }
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    setProcessing(true);
    try {
      await onApprove(amendment.id, reviewNotes);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!onReject || !reviewNotes.trim()) {
      alert('Please provide review notes for rejection');
      return;
    }
    setProcessing(true);
    try {
      await onReject(amendment.id, reviewNotes);
    } finally {
      setProcessing(false);
    }
  };

  const canReview = (profile?.roles[0]?.role === 'SUPER_ADMIN' || profile?.roles[0]?.role === 'COUNTY_ADMIN') &&
                     (amendment.status === 'SUBMITTED' || amendment.status === 'UNDER_REVIEW');

  const getStatusBadge = () => {
    const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
      APPROVED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
      REJECTED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
      SUBMITTED: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
      UNDER_REVIEW: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    };

    const config = statusConfig[amendment.status] || { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100' };
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${config.bg}`}>
        <Icon className={`h-5 w-5 ${config.color}`} />
        <span className={`font-semibold ${config.color}`}>
          {amendment.status.replace(/_/g, ' ')}
        </span>
      </div>
    );
  };

  const getAmendmentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      BYLAW_AMENDMENT: 'Bylaw Amendment',
      NAME_CHANGE: 'Name Change',
      ADDRESS_CHANGE: 'Address Change',
      OFFICIAL_CHANGE: 'Official Change',
      MEMBERSHIP_RULES: 'Membership Rules',
      SHARE_CAPITAL_CHANGE: 'Share Capital Change',
      OTHER: 'Other'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900">{amendment.request_number}</h2>
          <p className="text-gray-600 mt-1">{getAmendmentTypeLabel(amendment.amendment_type)}</p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cooperative Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cooperative Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Name:</span>
                <p className="font-medium text-gray-900">{amendment.cooperatives?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Registration Number:</span>
                <p className="font-medium text-gray-900">{amendment.cooperatives?.registration_number || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Proposed Changes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Proposed Changes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Current Value</label>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{amendment.current_value || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Proposed Value</label>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{amendment.proposed_value || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Justification */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Justification</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{amendment.reason}</p>
          </div>

          {/* Supporting Documents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Supporting Documents</h3>
            <div className="space-y-3">
              {supportingDocUrl ? (
                <a
                  href={supportingDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FileText className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Supporting Documents</p>
                    <p className="text-sm text-gray-500">Click to view or download</p>
                  </div>
                  <Download className="h-5 w-5 text-gray-400" />
                </a>
              ) : (
                <p className="text-sm text-gray-500">No supporting documents attached</p>
              )}

              {minutesUrl ? (
                <a
                  href={minutesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FileText className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Resolution Minutes</p>
                    <p className="text-sm text-gray-500">Click to view or download</p>
                  </div>
                  <Download className="h-5 w-5 text-gray-400" />
                </a>
              ) : (
                <p className="text-sm text-gray-500">No resolution minutes attached</p>
              )}
            </div>
          </div>

          {/* Review Section */}
          {canReview && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Amendment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={4}
                    placeholder="Add notes about your review decision..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleReject}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-5 w-5" />
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Review History */}
          {amendment.review_notes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review History</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">
                  Reviewed on {amendment.reviewed_at ? new Date(amendment.reviewed_at).toLocaleDateString() : 'N/A'}
                </p>
                <p className="text-gray-700">{amendment.review_notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Timeline */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-4">
              {amendment.submitted_at && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Submitted</p>
                    <p className="text-sm text-gray-600">
                      {new Date(amendment.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {amendment.reviewed_at && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <Calendar className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Reviewed</p>
                    <p className="text-sm text-gray-600">
                      {new Date(amendment.reviewed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {amendment.approved_at && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Approved</p>
                    <p className="text-sm text-gray-600">
                      {new Date(amendment.approved_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {amendment.effective_date && amendment.status === 'APPROVED' && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Effective Date</p>
                    <p className="text-sm text-gray-600">
                      {new Date(amendment.effective_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
