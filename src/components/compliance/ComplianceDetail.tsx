import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Download, CheckCircle, XCircle, Award, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useDocumentUpload } from '../../hooks/useDocumentUpload';

interface ComplianceDocumentLinkProps {
  path: string | null;
  label: string;
}

function ComplianceDocumentLink({ path, label }: ComplianceDocumentLinkProps) {
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
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <FileText className="h-5 w-5 text-red-600" />
        <div className="flex-1">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
        <Loader className="h-5 w-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
        <FileText className="h-5 w-5 text-red-600" />
        <div className="flex-1">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-red-600">Error loading document</p>
        </div>
      </div>
    );
  }

  return (
    <a
      href={signedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-red-300 transition-colors group"
    >
      <FileText className="h-5 w-5 text-red-600" />
      <div className="flex-1">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">Click to download</p>
      </div>
      <Download className="h-5 w-5 text-gray-400 group-hover:text-red-600" />
    </a>
  );
}

interface ComplianceReport {
  id: string;
  report_number: string;
  cooperative_id: string;
  financial_year: number;
  agm_held: boolean;
  agm_date: string | null;
  agm_minutes_url: string | null;
  financial_statement_url: string | null;
  audit_report_url: string | null;
  annual_return_url: string | null;
  bylaws_compliant: boolean;
  meetings_compliant: boolean;
  records_compliant: boolean;
  financial_compliant: boolean;
  status: string;
  compliance_score: number | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  cooperatives: {
    name: string;
    registration_number: string;
  };
}

interface ComplianceDetailProps {
  reportId: string;
  onBack: () => void;
  role: string;
}

export default function ComplianceDetail({ reportId, onBack, role }: ComplianceDetailProps) {
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('compliance_reports')
        .select(`
          *,
          cooperatives (
            name,
            registration_number
          )
        `)
        .eq('id', reportId)
        .single();

      if (error) throw error;
      setReport(data);
    } catch (error) {
      console.error('Error loading compliance report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return 'bg-green-100 text-green-800';
      case 'NON_COMPLIANT':
        return 'bg-red-100 text-red-800';
      case 'PARTIALLY_COMPLIANT':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading compliance report...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Compliance report not found</p>
        <button onClick={onBack} className="mt-4 text-red-600 hover:text-red-700">
          Go Back
        </button>
      </div>
    );
  }

  const complianceChecks = [
    { label: 'Bylaws Compliance', value: report.bylaws_compliant },
    { label: 'Meetings Compliance', value: report.meetings_compliant },
    { label: 'Records Compliance', value: report.records_compliant },
    { label: 'Financial Compliance', value: report.financial_compliant }
  ];

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
            <h2 className="text-3xl font-bold text-gray-900">{report.report_number}</h2>
            <p className="text-gray-600">Financial Year {report.financial_year}</p>
          </div>
        </div>
        <div>
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(report.status)}`}>
            {report.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Cooperative Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cooperative Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Cooperative Name</label>
            <p className="mt-1 text-gray-900">{report.cooperatives.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Registration Number</label>
            <p className="mt-1 text-gray-900">{report.cooperatives.registration_number}</p>
          </div>
        </div>
      </div>

      {/* Compliance Score */}
      {report.compliance_score !== null && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-red-600 w-16 h-16 rounded-lg flex items-center justify-center">
              <Award className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Compliance Score</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${
                      report.compliance_score >= 80 ? 'bg-green-500' :
                      report.compliance_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${report.compliance_score}%` }}
                  ></div>
                </div>
                <span className="text-3xl font-bold text-gray-900">{report.compliance_score}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AGM Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Annual General Meeting</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">AGM Status</label>
            <p className={`mt-1 font-semibold ${report.agm_held ? 'text-green-600' : 'text-red-600'}`}>
              {report.agm_held ? 'Held' : 'Not Held'}
            </p>
          </div>
          {report.agm_held && report.agm_date && (
            <div>
              <label className="text-sm font-medium text-gray-600">AGM Date</label>
              <p className="mt-1 text-gray-900">{new Date(report.agm_date).toLocaleDateString()}</p>
            </div>
          )}
        </div>
        {report.agm_minutes_url && (
          <div className="mt-4">
            <ComplianceDocumentLink path={report.agm_minutes_url} label="AGM Minutes" />
          </div>
        )}
      </div>

      {/* Compliance Checks */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Checks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complianceChecks.map((check, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {check.value ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <span className="font-medium text-gray-900">{check.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Supporting Documents</h3>
        <div className="space-y-3">
          <ComplianceDocumentLink path={report.financial_statement_url} label="Financial Statement" />
          <ComplianceDocumentLink path={report.audit_report_url} label="Audit Report" />
          <ComplianceDocumentLink path={report.annual_return_url} label="Annual Return" />
          {report.agm_minutes_url && (
            <ComplianceDocumentLink path={report.agm_minutes_url} label="AGM Minutes" />
          )}
        </div>
      </div>

      {/* Review Information */}
      {report.reviewed_at && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Reviewed On</label>
              <p className="mt-1 text-gray-900">{new Date(report.reviewed_at).toLocaleDateString()}</p>
            </div>
            {report.review_notes && (
              <div>
                <label className="text-sm font-medium text-gray-600">Review Notes</label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{report.review_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
