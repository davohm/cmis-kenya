import { Download, Eye, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Cooperative } from '../../hooks/useCooperatives';
import { exportToCSV } from '../../hooks/useOfficialSearches';

interface SearchResultsProps {
  cooperatives: Cooperative[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewDetails: (cooperative: Cooperative) => void;
  onGetCertificate: (cooperative: Cooperative) => void;
  loading: boolean;
}

export default function SearchResults({
  cooperatives,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
  onViewDetails,
  onGetCertificate,
  loading
}: SearchResultsProps) {
  const handleExport = () => {
    exportToCSV(cooperatives, `cooperatives_search_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'DISSOLVED':
        return 'bg-red-100 text-red-800';
      case 'SUSPENDED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center text-gray-500">Loading results...</div>
      </div>
    );
  }

  if (cooperatives.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          No cooperatives found. Try adjusting your search filters.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
          <p className="text-sm text-gray-600">{totalCount} cooperative{totalCount !== 1 ? 's' : ''} found</p>
        </div>
        <button
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registration No.
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                County
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reg. Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cooperatives.map((coop) => (
              <tr key={coop.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">{coop.name}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900">{coop.registration_number || 'N/A'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-600">{coop.cooperative_types?.name || 'N/A'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-600">{coop.tenants?.name || 'N/A'}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(coop.status)}`}>
                    {coop.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-600">
                    {coop.registration_date ? new Date(coop.registration_date).toLocaleDateString() : 'N/A'}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onViewDetails(coop)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onGetCertificate(coop)}
                      className="text-green-600 hover:text-green-700 p-1"
                      title="Get Certificate"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
