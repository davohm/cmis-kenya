import { useState } from 'react';
import { Search, Filter, Eye, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { 
  useAuditorApplications, 
  AuditorApplication,
  AuditorApplicationStatus,
  AuditorQualification 
} from '../../hooks/useAuditorRegistration';

interface AuditorApplicationsListProps {
  role: string;
  userId?: string;
  onSelectApplication: (application: AuditorApplication) => void;
}

export default function AuditorApplicationsList({
  role,
  userId,
  onSelectApplication
}: AuditorApplicationsListProps) {
  const [statusFilter, setStatusFilter] = useState<AuditorApplicationStatus | 'ALL'>('ALL');
  const [qualificationFilter, setQualificationFilter] = useState<AuditorQualification | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page] = useState(1);

  const { applications, loading, error, totalCount } = useAuditorApplications(
    role,
    userId,
    {
      status: statusFilter,
      qualification: qualificationFilter,
      search: searchQuery
    },
    page,
    20
  );

  const getStatusBadge = (status: AuditorApplicationStatus) => {
    const badges = {
      PENDING: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      UNDER_REVIEW: { icon: AlertCircle, color: 'bg-blue-100 text-blue-800', label: 'Under Review' },
      APPROVED: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Approved' },
      REJECTED: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Rejected' }
    };

    const badge = badges[status];
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  const getQualificationLabel = (qualification: AuditorQualification) => {
    const labels = {
      CERTIFIED_PUBLIC_ACCOUNTANT: 'CPA',
      CHARTERED_ACCOUNTANT: 'CA',
      COOPERATIVE_AUDITOR: 'Cooperative Auditor',
      OTHER: 'Other'
    };
    return labels[qualification];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, certificate number, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AuditorApplicationStatus | 'ALL')}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <select
            value={qualificationFilter}
            onChange={(e) => setQualificationFilter(e.target.value as AuditorQualification | 'ALL')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="ALL">All Qualifications</option>
            <option value="CERTIFIED_PUBLIC_ACCOUNTANT">CPA</option>
            <option value="CHARTERED_ACCOUNTANT">CA</option>
            <option value="COOPERATIVE_AUDITOR">Cooperative Auditor</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qualification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Experience
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No applications found
                  </td>
                </tr>
              ) : (
                applications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {application.application_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        Cert: {application.certificate_number}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {application.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {application.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getQualificationLabel(application.qualification)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {application.certification_body}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {application.years_experience} years
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(application.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(application.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => onSelectApplication(application)}
                        className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalCount > 0 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-700">
              Showing {applications.length} of {totalCount} applications
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
