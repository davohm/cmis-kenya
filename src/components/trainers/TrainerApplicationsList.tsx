import { useState } from 'react';
import { Search, Filter, GraduationCap, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  useTrainerApplications, 
  TrainerApplication,
  TrainerApplicationStatus,
  TrainerSpecialization 
} from '../../hooks/useTrainerRegistration';

interface TrainerApplicationsListProps {
  role: string;
  onSelectApplication: (application: TrainerApplication) => void;
}

export default function TrainerApplicationsList({ role, onSelectApplication }: TrainerApplicationsListProps) {
  const { profile } = useAuth();
  const [statusFilter, setStatusFilter] = useState<TrainerApplicationStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page] = useState(1);

  const { applications, loading, error, totalCount } = useTrainerApplications(
    role,
    profile?.id,
    {
      status: statusFilter,
      search: searchQuery
    },
    page,
    20
  );

  const getStatusColor = (status: TrainerApplicationStatus) => {
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

  const getStatusIcon = (status: TrainerApplicationStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'UNDER_REVIEW':
        return <Filter className="h-4 w-4" />;
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
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
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Trainer Applications</h3>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TrainerApplicationStatus | 'ALL')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Application #</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Applicant</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Education</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Experience</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Specializations</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  No applications found
                </td>
              </tr>
            ) : (
              applications.map((application) => (
                <tr
                  key={application.id}
                  onClick={() => onSelectApplication(application)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="h-4 w-4 text-red-600" />
                      <span className="font-mono text-sm text-gray-900">
                        {application.application_number}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-semibold text-gray-900">{application.full_name}</p>
                      <p className="text-sm text-gray-600">{application.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-700">
                      {application.education_level}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-700">
                      {application.years_experience} years
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1">
                      {application.specializations.slice(0, 2).map((spec) => (
                        <span key={spec} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {spec.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {application.specializations.length > 2 && (
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          +{application.specializations.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(application.status)}`}>
                      {getStatusIcon(application.status)}
                      <span>{application.status.replace(/_/g, ' ')}</span>
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600">
                      {new Date(application.submitted_at).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalCount > 20 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {applications.length} of {totalCount} applications
          </p>
        </div>
      )}
    </div>
  );
}
