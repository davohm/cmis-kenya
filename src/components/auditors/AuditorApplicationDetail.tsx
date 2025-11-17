import { useState } from 'react';
import { 
  ArrowLeft, User, Award, FileText, CheckCircle, XCircle, 
  Download, Clock, AlertCircle, Shield 
} from 'lucide-react';
import { AuditorApplication } from '../../hooks/useAuditorRegistration';
import { useAuditorActions } from '../../hooks/useAuditorRegistration';
import { useAuth } from '../../contexts/AuthContext';

interface AuditorApplicationDetailProps {
  application: AuditorApplication;
  onBack: () => void;
  onUpdate: () => void;
  role: string;
}

export default function AuditorApplicationDetail({
  application,
  onBack,
  onUpdate,
  role
}: AuditorApplicationDetailProps) {
  const { profile } = useAuth();
  const { updateApplicationStatus, addVerificationNotes, submitting } = useAuditorActions();
  const [verificationNotes, setVerificationNotes] = useState(application.verification_notes || '');
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAdmin = role === 'SUPER_ADMIN' || role === 'COUNTY_ADMIN';
  const canReview = isAdmin && application.status !== 'APPROVED' && application.status !== 'REJECTED';

  const handleSaveVerificationNotes = async () => {
    if (!profile?.id) return;
    
    const result = await addVerificationNotes(application.id, verificationNotes);
    if (result.success) {
      setSuccess('Verification notes saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || 'Failed to save notes');
    }
  };

  const handleApprove = async () => {
    if (!profile?.id) return;

    const result = await updateApplicationStatus(
      application.id,
      'APPROVED',
      profile.id,
      reviewNotes
    );

    if (result.success) {
      setSuccess('Application approved successfully!');
      setTimeout(() => {
        onUpdate();
        onBack();
      }, 2000);
    } else {
      setError(result.error || 'Failed to approve application');
    }
  };

  const handleReject = async () => {
    if (!profile?.id || !rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    const result = await updateApplicationStatus(
      application.id,
      'REJECTED',
      profile.id,
      reviewNotes,
      rejectionReason
    );

    if (result.success) {
      setSuccess('Application rejected');
      setTimeout(() => {
        onUpdate();
        onBack();
      }, 2000);
    } else {
      setError(result.error || 'Failed to reject application');
    }
    setShowRejectModal(false);
  };

  const getStatusBadge = () => {
    const badges = {
      PENDING: { icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending Review' },
      UNDER_REVIEW: { icon: AlertCircle, color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Under Review' },
      APPROVED: { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200', label: 'Approved' },
      REJECTED: { icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected' }
    };

    const badge = badges[application.status];
    const Icon = badge.icon;

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-lg border ${badge.color}`}>
        <Icon className="h-4 w-4 mr-2" />
        <span className="font-medium">{badge.label}</span>
      </div>
    );
  };

  const documents = [
    { label: 'Professional Certificate', url: application.professional_certificate_url },
    { label: 'Academic Certificates', url: application.academic_certificates_url },
    { label: 'Practicing Certificate', url: application.practicing_certificate_url },
    { label: 'ID Copy', url: application.id_copy_url },
    { label: 'CV/Resume', url: application.cv_url }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Applications
        </button>
        {getStatusBadge()}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
              <User className="h-5 w-5 mr-2 text-red-600" />
              Applicant Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Application Number</label>
                <p className="mt-1 text-sm text-gray-900 font-medium">{application.application_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="mt-1 text-sm text-gray-900">{application.full_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">ID Number</label>
                <p className="mt-1 text-sm text-gray-900">{application.id_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1 text-sm text-gray-900">{application.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{application.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Submitted Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(application.submitted_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
              <Award className="h-5 w-5 mr-2 text-red-600" />
              Professional Qualifications
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Qualification</label>
                <p className="mt-1 text-sm text-gray-900">
                  {application.qualification.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Certification Body</label>
                <p className="mt-1 text-sm text-gray-900">{application.certification_body}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Certificate Number</label>
                <p className="mt-1 text-sm text-gray-900 font-medium">{application.certificate_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Issue Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(application.certificate_issue_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Years of Experience</label>
                <p className="mt-1 text-sm text-gray-900">{application.years_experience} years</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Specializations</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {application.specializations.map((spec) => (
                    <span
                      key={spec}
                      className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
              <FileText className="h-5 w-5 mr-2 text-red-600" />
              Uploaded Documents
            </h3>

            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{doc.label}</span>
                  </div>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </a>
                  ) : (
                    <span className="text-sm text-gray-500">Not uploaded</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {application.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 flex items-center mb-2">
                <XCircle className="h-5 w-5 mr-2" />
                Rejection Reason
              </h3>
              <p className="text-sm text-red-800">{application.rejection_reason}</p>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <Shield className="h-5 w-5 mr-2 text-red-600" />
                Admin Verification
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Checklist
                  </label>
                  <div className="space-y-2">
                    {[
                      'Professional certificate verified',
                      'Academic certificates verified',
                      'Practicing certificate valid',
                      'ID verification completed',
                      'Regulatory compliance checked'
                    ].map((item, index) => (
                      <label key={index} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Notes
                  </label>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Add verification notes..."
                  />
                  <button
                    onClick={handleSaveVerificationNotes}
                    disabled={submitting}
                    className="mt-2 w-full px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  >
                    Save Notes
                  </button>
                </div>

                {canReview && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Review Comments
                      </label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Add review comments..."
                      />
                    </div>

                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={handleApprove}
                        disabled={submitting}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4 inline mr-2" />
                        Approve Application
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={submitting}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4 inline mr-2" />
                        Reject Application
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {application.reviewed_by && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Review History</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Reviewed by: {application.reviewer?.full_name || 'Unknown'}</p>
                  <p>Date: {application.reviewed_at ? new Date(application.reviewed_at).toLocaleDateString() : 'N/A'}</p>
                  {application.review_notes && (
                    <p className="mt-2 text-gray-700">{application.review_notes}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Application</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Please provide a reason for rejection..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || submitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
