import { useState, useEffect } from 'react';
import { Search, AlertCircle, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { useComplaints, Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../../hooks/useComplaints';
import { useAuth } from '../../contexts/AuthContext';

interface ComplaintsListProps {
  role: string;
  tenantId?: string;
  cooperativeId?: string;
  onSelectComplaint: (complaint: Complaint) => void;
  onSubmitNew?: () => void;
}

export default function ComplaintsList({ role, tenantId, cooperativeId, onSelectComplaint, onSubmitNew }: ComplaintsListProps) {
  const { profile } = useAuth();
  const [filters, setFilters] = useState({
    status: 'ALL' as ComplaintStatus | 'ALL',
    category: 'ALL' as ComplaintCategory | 'ALL',
    priority: 'ALL' as ComplaintPriority | 'ALL',
    search: ''
  });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { complaints, loading, error, totalCount, totalPages } = useComplaints(
    role,
    tenantId,
    cooperativeId,
    profile?.id,
    filters,
    page,
    pageSize
  );

  const [stats, setStats] = useState({
    total: 0,
    received: 0,
    investigating: 0,
    resolved: 0
  });

  useEffect(() => {
    calculateStats();
  }, [complaints]);

  const calculateStats = () => {
    setStats({
      total: totalCount,
      received: complaints.filter(c => c.complaint_status === 'RECEIVED').length,
      investigating: complaints.filter(c => c.complaint_status === 'INVESTIGATING').length,
      resolved: complaints.filter(c => c.complaint_status === 'RESOLVED').length
    });
  };

  const getPriorityColor = (priority: ComplaintPriority) => {
    const colors = {
      LOW: 'bg-blue-100 text-blue-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: ComplaintStatus) => {
    switch (status) {
      case 'RECEIVED':
        return <Clock className="h-4 w-4" />;
      case 'INVESTIGATING':
        return <AlertCircle className="h-4 w-4" />;
      case 'RESOLVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'DISMISSED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: ComplaintStatus) => {
    const colors = {
      RECEIVED: 'bg-blue-100 text-blue-800',
      INVESTIGATING: 'bg-yellow-100 text-yellow-800',
      RESOLVED: 'bg-green-100 text-green-800',
      DISMISSED: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading && complaints.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Complaints</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Open/Received</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.received}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Investigating</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.investigating}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Resolved</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.resolved}</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by complaint number or subject..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as ComplaintStatus | 'ALL' })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="RECEIVED">Received</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value as ComplaintCategory | 'ALL' })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="ALL">All Categories</option>
            <option value="GOVERNANCE">Governance</option>
            <option value="FINANCIAL_MISMANAGEMENT">Financial Mismanagement</option>
            <option value="MEMBER_DISPUTE">Member Dispute</option>
            <option value="SERVICE_DELIVERY">Service Delivery</option>
            <option value="FRAUD">Fraud</option>
            <option value="CORRUPTION">Corruption</option>
            <option value="OTHER">Other</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value as ComplaintPriority | 'ALL' })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {/* Submit Button */}
          {onSubmitNew && (
            <button
              onClick={onSubmitNew}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
            >
              <PlusCircle className="h-5 w-5" />
              <span>File Complaint</span>
            </button>
          )}
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200 text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Complaint #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cooperative
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No complaints found</p>
                  </td>
                </tr>
              ) : (
                complaints.map((complaint) => (
                  <tr
                    key={complaint.id}
                    onClick={() => onSelectComplaint(complaint)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {complaint.inquiry_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">{complaint.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {complaint.cooperatives?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {complaint.complaint_category?.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.complaint_status)}`}>
                        {getStatusIcon(complaint.complaint_status)}
                        {complaint.complaint_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(complaint.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
