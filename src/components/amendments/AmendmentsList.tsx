import { useState } from 'react';
import { Search, Plus, FileEdit, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useAmendmentRequests, AmendmentRequest, AmendmentStatus, AmendmentType } from '../../hooks/useAmendmentRequests';

interface AmendmentsListProps {
  role: string;
  tenantId?: string;
  cooperativeId?: string;
  onSelectAmendment: (amendment: AmendmentRequest) => void;
  onSubmitNew: () => void;
}

export default function AmendmentsList({ role, tenantId, cooperativeId, onSelectAmendment, onSubmitNew }: AmendmentsListProps) {
  const [statusFilter, setStatusFilter] = useState<AmendmentStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<AmendmentType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { amendments, loading, totalCount, totalPages } = useAmendmentRequests(
    role,
    tenantId,
    cooperativeId,
    {
      status: statusFilter,
      amendmentType: typeFilter,
      search: searchTerm
    },
    page,
    10
  );

  const getStatusColor = (status: AmendmentStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800';
      case 'ADDITIONAL_INFO_REQUIRED':
        return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: AmendmentStatus) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'ADDITIONAL_INFO_REQUIRED':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <FileEdit className="h-5 w-5 text-gray-600" />;
    }
  };

  const getAmendmentTypeLabel = (type: AmendmentType) => {
    const labels: Record<AmendmentType, string> = {
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

  const canSubmit = role === 'COOPERATIVE_ADMIN' || role === 'SUPER_ADMIN' || role === 'COUNTY_ADMIN';

  const approvedCount = amendments.filter(a => a.status === 'APPROVED').length;
  const pendingCount = amendments.filter(a => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length;
  const rejectedCount = amendments.filter(a => a.status === 'REJECTED').length;

  if (loading && amendments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading amendments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Amendment Requests</h2>
          <p className="text-gray-600 mt-1">
            {totalCount} {totalCount === 1 ? 'request' : 'requests'}
          </p>
        </div>
        {canSubmit && (
          <button
            onClick={onSubmitNew}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Submit Amendment
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-10 w-10 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-600">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-10 w-10 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-10 w-10 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{rejectedCount}</p>
              <p className="text-sm text-gray-600">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by request number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AmendmentStatus | 'ALL')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ADDITIONAL_INFO_REQUIRED">Info Required</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as AmendmentType | 'ALL')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="ALL">All Types</option>
            <option value="BYLAW_AMENDMENT">Bylaw Amendment</option>
            <option value="NAME_CHANGE">Name Change</option>
            <option value="ADDRESS_CHANGE">Address Change</option>
            <option value="OFFICIAL_CHANGE">Official Change</option>
            <option value="MEMBERSHIP_RULES">Membership Rules</option>
            <option value="SHARE_CAPITAL_CHANGE">Share Capital Change</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Amendments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cooperative</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Changes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {amendments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No amendment requests found
                  </td>
                </tr>
              ) : (
                amendments.map((amendment) => (
                  <tr
                    key={amendment.id}
                    onClick={() => onSelectAmendment(amendment)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(amendment.status)}
                        <div>
                          <p className="font-semibold text-gray-900">{amendment.request_number}</p>
                          <p className="text-sm text-gray-600">
                            {amendment.submitted_at ? new Date(amendment.submitted_at).toLocaleDateString() : 'Draft'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{amendment.cooperatives?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-600">{amendment.cooperatives?.registration_number || ''}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {getAmendmentTypeLabel(amendment.amendment_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-500 line-through">{amendment.current_value?.substring(0, 30) || 'N/A'}</p>
                        <p className="text-green-600 font-medium">{amendment.proposed_value?.substring(0, 30) || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(amendment.status)}`}>
                        {amendment.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {amendment.submitted_at ? new Date(amendment.submitted_at).toLocaleDateString() : 'Not submitted'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
