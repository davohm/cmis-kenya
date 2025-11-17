import { useState, useEffect } from 'react';
import { ArrowLeft, User, Building2, Calendar, FileText, Download, CheckCircle, XCircle } from 'lucide-react';
import { Complaint, ComplaintStatus, useComplaints } from '../../hooks/useComplaints';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ComplaintDetailProps {
  complaint: Complaint;
  onBack: () => void;
  role: string;
}

export default function ComplaintDetail({ complaint, onBack, role }: ComplaintDetailProps) {
  const { profile } = useAuth();
  const { updateComplaintStatus, addInvestigationNotes, assignInvestigator } = useComplaints(
    role, undefined, undefined, undefined, {}, 1, 10
  );
  
  const [investigationNotes, setInvestigationNotes] = useState(complaint.investigation_notes || '');
  const [resolutionNotes, setResolutionNotes] = useState(complaint.resolution_notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [investigators, setInvestigators] = useState<Array<{ id: string; full_name: string }>>([]);
  const [selectedInvestigator, setSelectedInvestigator] = useState(complaint.assigned_to || '');

  const isAdmin = role === 'SUPER_ADMIN' || role === 'COUNTY_ADMIN';

  useEffect(() => {
    loadEvidenceUrls();
    if (isAdmin) {
      loadInvestigators();
    }
  }, []);

  const loadEvidenceUrls = async () => {
    if (!complaint.evidence_documents || complaint.evidence_documents.length === 0) return;

    const urls: string[] = [];
    for (const path of complaint.evidence_documents) {
      const { data } = await supabase.storage
        .from('registration-documents')
        .createSignedUrl(path, 3600);
      
      if (data?.signedUrl) {
        urls.push(data.signedUrl);
      }
    }
    setEvidenceUrls(urls);
  };

  const loadInvestigators = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('is_active', true)
      .order('full_name');

    setInvestigators(data || []);
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await addInvestigationNotes(complaint.id, investigationNotes);
    setSavingNotes(false);
  };

  const handleStatusUpdate = async (status: ComplaintStatus) => {
    setUpdatingStatus(true);
    const notes = status === 'RESOLVED' || status === 'DISMISSED' ? resolutionNotes : undefined;
    const result = await updateComplaintStatus(complaint.id, status, profile?.id || '', notes);
    setUpdatingStatus(false);
    
    if (result.success) {
      onBack();
    }
  };

  const handleAssignInvestigator = async () => {
    if (!selectedInvestigator) return;
    
    setUpdatingStatus(true);
    await assignInvestigator(complaint.id, selectedInvestigator);
    setUpdatingStatus(false);
    onBack();
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: 'bg-blue-100 text-blue-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      RECEIVED: 'bg-blue-100 text-blue-800',
      INVESTIGATING: 'bg-yellow-100 text-yellow-800',
      RESOLVED: 'bg-green-100 text-green-800',
      DISMISSED: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Complaints</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{complaint.subject}</h2>
            <p className="text-sm text-gray-600 mt-1">Complaint #{complaint.inquiry_number}</p>
          </div>
          <div className="flex gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(complaint.priority)}`}>
              {complaint.priority} Priority
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.complaint_status)}`}>
              {complaint.complaint_status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaint Details</h3>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
            </div>
          </div>

          {/* Evidence */}
          {evidenceUrls.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Evidence & Supporting Documents</h3>
              <div className="space-y-2">
                {complaint.evidence_documents?.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-700">{doc.split('/').pop()}</span>
                    </div>
                    <a
                      href={evidenceUrls[idx]}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Investigation Notes (Admin Only) */}
          {isAdmin && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Investigation Notes</h3>
              <textarea
                value={investigationNotes}
                onChange={(e) => setInvestigationNotes(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Add investigation notes..."
              />
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          )}

          {/* Resolution (if resolved or dismissed) */}
          {(complaint.complaint_status === 'RESOLVED' || complaint.complaint_status === 'DISMISSED') && complaint.resolution_notes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolution</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{complaint.resolution_notes}</p>
              {complaint.resolved_at && (
                <p className="text-sm text-gray-600 mt-4">
                  Resolved on {new Date(complaint.resolved_at).toLocaleDateString()} by {complaint.resolved_by_user?.full_name}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Complainant Info */}
          {!complaint.is_anonymous && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Complainant</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{complaint.requester_name}</div>
                    <div className="text-sm text-gray-600">{complaint.requester_email}</div>
                    {complaint.requester_phone && (
                      <div className="text-sm text-gray-600">{complaint.requester_phone}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {complaint.is_anonymous && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Anonymous Complaint</h3>
              <p className="text-sm text-gray-600">Complainant identity is protected</p>
            </div>
          )}

          {/* Cooperative Info */}
          {complaint.cooperatives && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cooperative</h3>
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-900">{complaint.cooperatives.name}</div>
                  <div className="text-sm text-gray-600">{complaint.cooperatives.registration_number}</div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Submitted</div>
                  <div className="text-sm text-gray-600">
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              {complaint.assigned_user && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Assigned to</div>
                    <div className="text-sm text-gray-600">{complaint.assigned_user.full_name}</div>
                  </div>
                </div>
              )}

              {complaint.resolved_at && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Resolved</div>
                    <div className="text-sm text-gray-600">
                      {new Date(complaint.resolved_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin Actions */}
          {isAdmin && complaint.complaint_status !== 'RESOLVED' && complaint.complaint_status !== 'DISMISSED' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h3>
              
              {/* Assign Investigator */}
              {complaint.complaint_status === 'RECEIVED' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign Investigator</label>
                  <select
                    value={selectedInvestigator}
                    onChange={(e) => setSelectedInvestigator(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-2"
                  >
                    <option value="">Select investigator</option>
                    {investigators.map((inv) => (
                      <option key={inv.id} value={inv.id}>{inv.full_name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssignInvestigator}
                    disabled={!selectedInvestigator || updatingStatus}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Assign & Start Investigation
                  </button>
                </div>
              )}

              {/* Status Updates */}
              <div className="space-y-2">
                {complaint.complaint_status === 'INVESTIGATING' && (
                  <>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Notes</label>
                      <textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Add resolution notes..."
                      />
                    </div>
                    <button
                      onClick={() => handleStatusUpdate('RESOLVED')}
                      disabled={updatingStatus}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Mark as Resolved</span>
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('DISMISSED')}
                      disabled={updatingStatus}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Dismiss Complaint</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
