import { useState, useEffect } from 'react';
import { Search, Clock, FileText, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOfficialSearches, useSearchHistory, SearchFilters } from '../../hooks/useOfficialSearches';
import { Cooperative } from '../../hooks/useCooperatives';
import SearchForm from '../searches/SearchForm';
import SearchResults from '../searches/SearchResults';
import CooperativeDetailView from '../searches/CooperativeDetailView';
import SearchCertificateModal from '../searches/SearchCertificateModal';

interface OfficialSearchesTabProps {
  role: string;
}

export default function OfficialSearchesTab({}: OfficialSearchesTabProps) {
  const { user } = useAuth();
  const { searchCooperatives, loading } = useOfficialSearches();
  const { history, loading: historyLoading, refresh: refreshHistory } = useSearchHistory(user?.id);
  
  const [activeView, setActiveView] = useState<'search' | 'history'>('search');
  const [searchResults, setSearchResults] = useState<Cooperative[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({});
  const [selectedCooperative, setSelectedCooperative] = useState<Cooperative | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [cooperativeForCertificate, setCooperativeForCertificate] = useState<Cooperative | null>(null);
  const [stats, setStats] = useState({
    totalSearches: 0,
    recentSearches: 0,
    certificatesIssued: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (user) {
      setStats({
        totalSearches: history.length,
        recentSearches: history.filter(h => {
          const dayAgo = new Date();
          dayAgo.setDate(dayAgo.getDate() - 1);
          return new Date(h.created_at) > dayAgo;
        }).length,
        certificatesIssued: history.filter(h => h.certificate_generated).length
      });
    }
  };

  useEffect(() => {
    loadStats();
  }, [history, user]);

  const handleSearch = async (filters: SearchFilters) => {
    setCurrentFilters(filters);
    setCurrentPage(1);
    const result = await searchCooperatives(filters, 1, 10);
    setSearchResults(result.cooperatives);
    setTotalCount(result.totalCount);
    setTotalPages(result.totalPages);
  };

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    const result = await searchCooperatives(currentFilters, page, 10);
    setSearchResults(result.cooperatives);
    setTotalCount(result.totalCount);
    setTotalPages(result.totalPages);
  };

  const handleViewDetails = (cooperative: Cooperative) => {
    setSelectedCooperative(cooperative);
  };

  const handleGetCertificate = (cooperative: Cooperative) => {
    setCooperativeForCertificate(cooperative);
    setShowCertificateModal(true);
  };

  const handleCertificateSuccess = () => {
    refreshHistory();
    loadStats();
  };

  const handleBack = () => {
    setSelectedCooperative(null);
  };

  if (selectedCooperative) {
    return (
      <CooperativeDetailView
        cooperative={selectedCooperative}
        onBack={handleBack}
        onGetCertificate={() => handleGetCertificate(selectedCooperative)}
      />
    );
  }

  const statCards = [
    {
      label: 'Total Searches',
      value: stats.totalSearches,
      icon: Search,
      color: 'bg-red-600',
      visible: !!user
    },
    {
      label: 'Recent Searches (24h)',
      value: stats.recentSearches,
      icon: Clock,
      color: 'bg-yellow-600',
      visible: !!user
    },
    {
      label: 'Certificates Issued',
      value: stats.certificatesIssued,
      icon: FileText,
      color: 'bg-green-600',
      visible: !!user
    },
    {
      label: 'Search Service',
      value: 'Available',
      icon: TrendingUp,
      color: 'bg-green-700',
      visible: !user
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Official Searches</h2>
            <p className="text-gray-600 mt-1">
              Search for registered cooperatives and obtain official certificates
            </p>
          </div>
        </div>

        {user && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {statCards.filter(card => card.visible).map((card, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className={`${card.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                  <card.icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm text-gray-600 mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {typeof card.value === 'number' ? card.value : card.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {!user && (
          <div className="bg-gradient-to-r from-red-600 to-green-700 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Search className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Public Search Service</h3>
                <p className="text-gray-100">
                  Search for any registered cooperative in Kenya. Official certificates require payment.
                </p>
              </div>
            </div>
          </div>
        )}

        {user && (
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setActiveView('search')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeView === 'search'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              New Search
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeView === 'history'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Search History
            </button>
          </div>
        )}

        {activeView === 'search' && (
          <div className="space-y-6">
            <SearchForm onSearch={handleSearch} loading={loading} />

            {searchResults.length > 0 && (
              <SearchResults
                cooperatives={searchResults}
                totalCount={totalCount}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onViewDetails={handleViewDetails}
                onGetCertificate={handleGetCertificate}
                loading={loading}
              />
            )}
          </div>
        )}

        {activeView === 'history' && user && (
          <div>
            {historyLoading ? (
              <div className="text-center py-8 text-gray-500">Loading search history...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No search history yet. Start by searching for cooperatives.
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Search History</h3>
                <div className="space-y-3">
                  {history.map((search) => (
                    <div
                      key={search.id}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {search.cooperative?.name || 'Unknown Cooperative'}
                            </h4>
                            {search.certificate_generated && (
                              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                Certificate Issued
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Search No:</span> {search.search_number}
                            </div>
                            <div>
                              <span className="font-medium">Date:</span>{' '}
                              {new Date(search.created_at).toLocaleDateString()}
                            </div>
                            {search.certificate_number && (
                              <div>
                                <span className="font-medium">Certificate No:</span>{' '}
                                {search.certificate_number}
                              </div>
                            )}
                            {search.payment_reference && (
                              <div>
                                <span className="font-medium">Payment Ref:</span>{' '}
                                {search.payment_reference}
                              </div>
                            )}
                          </div>
                        </div>
                        {search.cooperative && (
                          <button
                            onClick={() => handleViewDetails(search.cooperative as Cooperative)}
                            className="ml-4 text-red-600 hover:text-red-700"
                          >
                            <FileText className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showCertificateModal && cooperativeForCertificate && (
        <SearchCertificateModal
          cooperative={cooperativeForCertificate}
          onClose={() => {
            setShowCertificateModal(false);
            setCooperativeForCertificate(null);
          }}
          onSuccess={handleCertificateSuccess}
        />
      )}
    </div>
  );
}
