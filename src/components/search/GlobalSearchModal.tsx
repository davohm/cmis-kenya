import { useState, useEffect, useRef } from 'react';
import { X, Search, Building2, FileText, Users, MessageSquareWarning, FileEdit, Shield, GraduationCap, SearchCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalSearch, SearchResult } from '../../hooks/useGlobalSearch';
import { supabase } from '../../lib/supabase';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResultSelect?: (result: SearchResult) => void;
}

export default function GlobalSearchModal({ isOpen, onClose, onResultSelect }: GlobalSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cooperativeId, setCooperativeId] = useState<string | undefined | null>(undefined);
  const [loadingCooperativeId, setLoadingCooperativeId] = useState(false);
  const { profile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const role = profile?.roles[0]?.role || 'CITIZEN';
  const tenantId = profile?.roles[0]?.tenant_id;
  const userId = profile?.id;

  // Only execute search when:
  // - Not COOPERATIVE_ADMIN, OR
  // - COOPERATIVE_ADMIN and cooperativeId is a valid string (not undefined, not null, not loading)
  const shouldSearch = role !== 'COOPERATIVE_ADMIN' || (role === 'COOPERATIVE_ADMIN' && typeof cooperativeId === 'string' && !loadingCooperativeId);

  const { results, loading, totalResults } = useGlobalSearch({
    query: shouldSearch ? searchQuery : '',
    role,
    tenantId,
    cooperativeId: cooperativeId === null ? undefined : cooperativeId,
    userId
  });

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const fetchCooperativeId = async () => {
      if (role === 'COOPERATIVE_ADMIN' && profile?.id) {
        setLoadingCooperativeId(true);
        
        try {
          const { data: memberData } = await supabase
            .from('cooperative_members')
            .select('cooperative_id')
            .eq('user_id', profile.id)
            .limit(1)
            .maybeSingle();

          if (memberData) {
            setCooperativeId(memberData.cooperative_id);
          } else {
            const userTenantId = profile?.roles?.[0]?.tenant_id || profile?.tenant_id;
            
            if (userTenantId) {
              const { data: coopData } = await supabase
                .from('cooperatives')
                .select('id')
                .eq('tenant_id', userTenantId)
                .limit(1)
                .maybeSingle();

              if (coopData) {
                setCooperativeId(coopData.id);
              } else {
                setCooperativeId(null);
              }
            } else {
              setCooperativeId(null);
            }
          }
        } catch (error) {
          console.error('Error fetching cooperative ID:', error);
          setCooperativeId(null);
        } finally {
          setLoadingCooperativeId(false);
        }
      } else {
        setCooperativeId(undefined);
        setLoadingCooperativeId(false);
      }
    };

    fetchCooperativeId();
  }, [role, profile?.id, profile?.tenant_id]);

  const handleResultClick = (result: SearchResult) => {
    if (onResultSelect) {
      onResultSelect(result);
    }
    onClose();
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'cooperatives': return Building2;
      case 'applications': return FileText;
      case 'users': return Users;
      case 'complaints': return MessageSquareWarning;
      case 'amendments': return FileEdit;
      case 'auditors': return Shield;
      case 'trainers': return GraduationCap;
      case 'official_searches': return SearchCheck;
      default: return Search;
    }
  };

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case 'cooperatives': return 'Cooperatives';
      case 'applications': return 'Applications';
      case 'users': return 'Users';
      case 'complaints': return 'Complaints';
      case 'amendments': return 'Amendments';
      case 'auditors': return 'Auditors';
      case 'trainers': return 'Trainers';
      case 'official_searches': return 'Official Searches';
      default: return type;
    }
  };

  const getPlaceholder = () => {
    const searchableItems = [];
    searchableItems.push('cooperatives');
    if (role === 'SUPER_ADMIN' || role === 'COUNTY_ADMIN' || role === 'COUNTY_OFFICER') {
      searchableItems.push('applications', 'users', 'complaints', 'amendments');
    }
    searchableItems.push('auditors', 'trainers');
    if (role !== 'COOPERATIVE_ADMIN') {
      searchableItems.push('official searches');
    }
    return `Search ${searchableItems.join(', ')}...`;
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="bg-yellow-200 text-gray-900">{part}</span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const renderCategory = (type: keyof typeof results, items: SearchResult[]) => {
    if (items.length === 0) return null;

    const Icon = getCategoryIcon(type);
    const label = getCategoryLabel(type);

    return (
      <div key={type} className="mb-6">
        <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
          <Icon className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">
            {label} ({items.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {items.map((result) => (
            <button
              key={result.id}
              onClick={() => handleResultClick(result)}
              className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 group-hover:text-red-600 transition-colors">
                    {highlightMatch(result.title, searchQuery)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {highlightMatch(result.subtitle, searchQuery)}
                  </p>
                  {result.metadata.status && (
                    <span className={`inline-block px-2 py-1 mt-2 text-xs font-medium rounded-full ${
                      result.metadata.status === 'ACTIVE' || result.metadata.status === 'APPROVED' || result.metadata.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : result.metadata.status === 'PENDING' || result.metadata.status === 'UNDER_REVIEW'
                        ? 'bg-yellow-100 text-yellow-800'
                        : result.metadata.status === 'REJECTED' || result.metadata.status === 'DISMISSED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {result.metadata.status}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center px-4 pt-20 pb-20">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>

        <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
          <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
            <div className="flex items-center px-4 py-3">
              <Search className="h-5 w-5 text-gray-400 mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getPlaceholder()}
                className="flex-1 outline-none text-lg"
              />
              {loading && (
                <Loader2 className="h-5 w-5 text-gray-400 animate-spin mr-3" />
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">ESC</kbd> to close
              </p>
              {totalResults > 0 && (
                <p className="text-xs text-gray-600 font-medium">
                  {totalResults} result{totalResults !== 1 ? 's' : ''} found
                </p>
              )}
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
            {role === 'COOPERATIVE_ADMIN' && loadingCooperativeId ? (
              <div className="px-4 py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your cooperative data...</p>
              </div>
            ) : role === 'COOPERATIVE_ADMIN' && cooperativeId === null ? (
              <div className="px-4 py-12 text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <X className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Cooperative Not Found
                </h3>
                <p className="text-red-600">
                  Unable to find your cooperative. Please contact support.
                </p>
              </div>
            ) : !searchQuery || searchQuery.length < 2 ? (
              <div className="px-4 py-12 text-center">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Global Search
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Type at least 2 characters to search across {role === 'SUPER_ADMIN' ? 'all' : 'your'} cooperatives, 
                  {(role === 'SUPER_ADMIN' || role === 'COUNTY_ADMIN' || role === 'COUNTY_OFFICER') && ' applications, users, complaints,'}
                  {' '}auditors, trainers, and more.
                </p>
              </div>
            ) : loading ? (
              <div className="px-4 py-12">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="mb-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                    <div className="h-12 bg-gray-100 rounded mb-2"></div>
                  </div>
                ))}
              </div>
            ) : totalResults === 0 ? (
              <div className="px-4 py-12 text-center">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No results found
                </h3>
                <p className="text-gray-500">
                  Try searching with different keywords or check your spelling.
                </p>
              </div>
            ) : (
              <div className="py-2">
                {renderCategory('cooperatives', results.cooperatives)}
                {renderCategory('applications', results.applications)}
                {renderCategory('users', results.users)}
                {renderCategory('complaints', results.complaints)}
                {renderCategory('amendments', results.amendments)}
                {renderCategory('auditors', results.auditors)}
                {renderCategory('trainers', results.trainers)}
                {renderCategory('official_searches', results.official_searches)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
