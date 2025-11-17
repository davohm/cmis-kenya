import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, FileText, User, Calendar, ArrowLeft, Download, Loader } from 'lucide-react';
import type { Application } from '../../../hooks/useApplications';
import { useApplicationActions } from '../../../hooks/useApplicationActions';
import { useDocumentUpload } from '../../../hooks/useDocumentUpload';
import { useNotifications } from '../../../hooks/useNotifications';

interface ApplicationDetailProps {
  application: Application;
  onBack: () => void;
  onActionComplete: () => void;
}

interface DocumentLinkProps {
  path: string | null | undefined;
  label: string;
}

function DocumentLink({ path, label }: DocumentLinkProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { getSignedUrl } = useDocumentUpload();

  useEffect(() => {
    if (path) {
      setLoading(true);
      getSignedUrl(path).then(url => {
        setSignedUrl(url);
        setLoading(false);
      });
    }
  }, [path]);

  if (!path) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">{label} - Not uploaded</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <FileText className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">{label}</p>
            <p className="text-xs text-gray-500">Loading...</p>
          </div>
        </div>
        <Loader className="h-5 w-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">{label} - Error loading document</p>
      </div>
    );
  }

  return (
    <a
      href={signedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors group"
    >
      <div className="flex items-center space-x-3">
        <FileText className="h-5 w-5 text-red-600" />
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-xs text-gray-500">Click to view</p>
        </div>
      </div>
      <Download className="h-5 w-5 text-gray-400 group-hover:text-red-600" />
    </a>
  );
}

export default function ApplicationDetail({ application, onBack, onActionComplete }: ApplicationDetailProps) {
  const { loading, approveApplication, rejectApplication, requestInfo } = useApplicationActions();
  const { notifyApplicationStatus } = useNotifications();
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [infoNotes, setInfoNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await approveApplication(application.id);
      
      // Send notification to applicant
      if (application.applicant_user_id) {
        await notifyApplicationStatus(
          application.applicant_user_id,
          application.application_number,
          'APPROVED',
          application.proposed_name
        );
      }
      
      showToast('success', 'Application approved successfully and cooperative created!');
      setShowApproveModal(false);
      setTimeout(() => {
        onActionComplete();
      }, 1500);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Failed to approve application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showToast('error', 'Please provide a rejection reason');
      return;
    }
    setActionLoading(true);
    try {
      await rejectApplication(application.id, rejectionReason);
      
      // Send notification to applicant
      if (application.applicant_user_id) {
        await notifyApplicationStatus(
          application.applicant_user_id,
          application.application_number,
          'REJECTED',
          application.proposed_name
        );
      }
      
      showToast('success', 'Application rejected successfully');
      setShowRejectModal(false);
      setTimeout(() => {
        onActionComplete();
      }, 1500);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Failed to reject application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!infoNotes.trim()) {
      showToast('error', 'Please provide notes about required information');
      return;
    }
    setActionLoading(true);
    try {
      await requestInfo(application.id, infoNotes);
      showToast('success', 'Additional information requested successfully');
      setShowInfoModal(false);
      setTimeout(() => {
        onActionComplete();
      }, 1500);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Failed to request information');
    } finally {
      setActionLoading(false);
    }
  };

  const canTakeAction = ['SUBMITTED', 'UNDER_REVIEW'].includes(application.status);

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to List</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{application.proposed_name}</h2>
            <p className="text-gray-600 mt-1">Application {application.application_number}</p>
          </div>
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
            application.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
            application.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
            application.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-700' :
            application.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {application.status.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-red-600" />
              Basic Information
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Cooperative Type</label>
                <p className="font-medium text-gray-900">{application.cooperative_types?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Category</label>
                <p className="font-medium text-gray-900">{application.cooperative_types?.category || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">County</label>
                <p className="font-medium text-gray-900">{application.tenants?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Proposed Members</label>
                <p className="font-medium text-gray-900">{application.proposed_members}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Proposed Share Capital</label>
                <p className="font-medium text-gray-900">
                  KES {application.proposed_share_capital?.toLocaleString() || '0'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Primary Activity</label>
                <p className="font-medium text-gray-900">{application.primary_activity || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Operating Area</label>
                <p className="font-medium text-gray-900">{application.operating_area || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-red-600" />
              Contact Details
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Contact Person</label>
                <p className="font-medium text-gray-900">{application.contact_person}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <p className="font-medium text-gray-900">{application.contact_phone}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <p className="font-medium text-gray-900">{application.contact_email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Address</label>
                <p className="font-medium text-gray-900">{application.address || 'N/A'}</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-red-600" />
              Timeline
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Created</label>
                <p className="font-medium text-gray-900">
                  {new Date(application.created_at).toLocaleString()}
                </p>
              </div>
              {application.submitted_at && (
                <div>
                  <label className="text-sm text-gray-600">Submitted</label>
                  <p className="font-medium text-gray-900">
                    {new Date(application.submitted_at).toLocaleString()}
                  </p>
                </div>
              )}
              {application.reviewed_at && (
                <div>
                  <label className="text-sm text-gray-600">Reviewed</label>
                  <p className="font-medium text-gray-900">
                    {new Date(application.reviewed_at).toLocaleString()}
                  </p>
                </div>
              )}
              {application.approved_at && (
                <div>
                  <label className="text-sm text-gray-600">Approved</label>
                  <p className="font-medium text-gray-900">
                    {new Date(application.approved_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-red-600" />
            Submitted Documents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DocumentLink path={application.bylaws_url} label="Proposed Bylaws" />
            <DocumentLink path={application.member_list_url} label="List of Proposed Members" />
            <DocumentLink path={application.minutes_url} label="Minutes of Formation Meeting" />
            <DocumentLink path={application.id_copies_url} label="ID Copies of Officials" />
          </div>
        </div>

        {(application.review_notes || application.rejection_reason) && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Review Notes</h3>
            <p className="text-gray-700">
              {application.review_notes || application.rejection_reason}
            </p>
          </div>
        )}

        {canTakeAction && (
          <div className="mt-8 pt-6 border-t border-gray-200 flex items-center space-x-4">
            <button
              onClick={() => setShowApproveModal(true)}
              disabled={loading || actionLoading}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="h-5 w-5" />
              <span>Approve Application</span>
            </button>
            <button
              onClick={() => setShowInfoModal(true)}
              disabled={loading || actionLoading}
              className="flex items-center space-x-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AlertCircle className="h-5 w-5" />
              <span>Request More Info</span>
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={loading || actionLoading}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="h-5 w-5" />
              <span>Reject Application</span>
            </button>
          </div>
        )}
      </div>

      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Approve Application</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to approve this application? A new cooperative will be created with registration number.
            </p>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm Approval'}
              </button>
              <button
                onClick={() => setShowApproveModal(false)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Application</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejecting this application:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent mb-4"
              rows={4}
              placeholder="Enter rejection reason..."
            />
            <div className="flex items-center space-x-4">
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Request Additional Information</h3>
            <p className="text-gray-600 mb-4">Specify what additional information is required:</p>
            <textarea
              value={infoNotes}
              onChange={(e) => setInfoNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent mb-4"
              rows={4}
              placeholder="Enter required information details..."
            />
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRequestInfo}
                disabled={actionLoading || !infoNotes.trim()}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Send Request'}
              </button>
              <button
                onClick={() => setShowInfoModal(false)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
