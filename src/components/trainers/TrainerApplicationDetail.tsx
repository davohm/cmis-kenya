import { useState } from 'react';
import { 
  ArrowLeft, GraduationCap, Mail, Phone, Calendar, FileText, 
  CheckCircle, XCircle, AlertCircle, Globe, Clock 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  TrainerApplication, 
  useTrainerActions 
} from '../../hooks/useTrainerRegistration';

interface TrainerApplicationDetailProps {
  application: TrainerApplication;
  onBack: () => void;
  onUpdate: () => void;
  role: string;
}

export default function TrainerApplicationDetail({ 
  application, 
  onBack, 
  onUpdate, 
  role 
}: TrainerApplicationDetailProps) {
  const { profile } = useAuth();
  const { updateApplicationStatus, updateVerificationNotes, reviewing } = useTrainerActions();
  const [verificationNotes, setVerificationNotes] = useState(application.verification_notes || '');
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = role === 'SUPER_ADMIN' || role === 'COUNTY_ADMIN';
  const canReview = isAdmin && application.status !== 'APPROVED' && application.status !== 'REJECTED';

  const handleSaveVerificationNotes = async () => {
    if (!profile?.id) return;

    const result = await updateVerificationNotes(application.id, verificationNotes);
    if (result.success) {
      setSuccessMessage('Verification notes saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setError(result.error || 'Failed to save notes');
      setTimeout(() => setError(null), 3000);
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
      setSuccessMessage('Application approved successfully!');
      setTimeout(() => {
        onUpdate();
        onBack();
      }, 2000);
    } else {
      setError(result.error || 'Failed to approve application');
      setTimeout(() => setError(null), 3000);
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
      setSuccessMessage('Application rejected');
      setTimeout(() => {
        onUpdate();
        onBack();
      }, 2000);
    } else {
      setError(result.error || 'Failed to reject application');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleMarkUnderReview = async () => {
    if (!profile?.id) return;

    const result = await updateApplicationStatus(
      application.id,
      'UNDER_REVIEW',
      profile.id,
      reviewNotes
    );

    if (result.success) {
      setSuccessMessage('Application marked as under review');
      setTimeout(() => {
        onUpdate();
      }, 2000);
    } else {
      setError(result.error || 'Failed to update status');
      setTimeout(() => setError(null), 3000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const documents = [
    { label: 'Academic Certificates', url: application.academic_certificates_url },
    { label: 'Training Certificates', url: application.training_certificates_url },
    { label: 'Sample Training Materials', url: application.sample_materials_url },
    { label: 'ID Copy', url: application.id_copy_url },
    { label: 'CV/Resume', url: application.cv_url }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="text-red-600 hover:text-red-700 font-semibold flex items-center space-x-2"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Applications</span>
        </button>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-500 rounded-lg p-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-500 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <GraduationCap className="h-8 w-8" />
              <h1 className="text-3xl font-bold">{application.full_name}</h1>
            </div>
            <p className="text-red-100 mb-4">Application #{application.application_number}</p>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(application.status)} bg-opacity-90`}>
                {application.status.replace(/_/g, ' ')}
              </span>
              <span className="text-sm text-red-100">
                Submitted {new Date(application.submitted_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{application.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">{application.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">ID Number</p>
                  <p className="font-semibold text-gray-900">{application.id_number}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Experience</p>
                  <p className="font-semibold text-gray-900">{application.years_experience} years</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Education & Qualifications</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Education Level</p>
                <p className="font-semibold text-gray-900">{application.education_level}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Institution</p>
                <p className="font-semibold text-gray-900">{application.institution}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Specializations</h2>
            <div className="flex flex-wrap gap-2">
              {application.specializations.map((spec) => (
                <span key={spec} className="px-3 py-2 bg-red-50 text-red-700 rounded-lg font-medium">
                  {spec.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Languages of Instruction</h2>
            <div className="flex flex-wrap gap-2">
              {application.languages.map((lang) => (
                <span key={lang} className="px-3 py-2 bg-green-50 text-green-700 rounded-lg font-medium flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>{lang}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Submitted Documents</h2>
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-gray-900">{doc.label}</span>
                  </div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-red-600 hover:text-red-700 font-semibold"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {isAdmin && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Admin Verification</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Verification Notes
                  </label>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Add verification notes about credentials, documents, etc."
                  />
                  <button
                    onClick={handleSaveVerificationNotes}
                    className="mt-2 text-sm text-red-600 hover:text-red-700 font-semibold"
                  >
                    Save Notes
                  </button>
                </div>

                {canReview && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Review Notes
                      </label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Add review notes..."
                      />
                    </div>

                    <div className="space-y-2">
                      {application.status === 'PENDING' && (
                        <button
                          onClick={handleMarkUnderReview}
                          disabled={reviewing}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                          <Clock className="h-5 w-5" />
                          <span>Mark Under Review</span>
                        </button>
                      )}

                      <button
                        onClick={handleApprove}
                        disabled={reviewing}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="h-5 w-5" />
                        <span>{reviewing ? 'Processing...' : 'Approve Application'}</span>
                      </button>

                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={reviewing}
                        className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <XCircle className="h-5 w-5" />
                        <span>Reject Application</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {application.status === 'APPROVED' && application.approver && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="font-semibold text-green-900">Approved</p>
              </div>
              <p className="text-sm text-green-800">
                By {(application.approver as any).full_name}
              </p>
              <p className="text-sm text-green-700">
                {application.approved_at ? new Date(application.approved_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          )}

          {application.status === 'REJECTED' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <p className="font-semibold text-red-900">Rejected</p>
              </div>
              {application.rejection_reason && (
                <p className="text-sm text-red-800 mt-2">{application.rejection_reason}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Application</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejection:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
              placeholder="Enter rejection reason..."
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || reviewing}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {reviewing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
