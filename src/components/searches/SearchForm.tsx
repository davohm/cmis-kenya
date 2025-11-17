import { useState, useEffect } from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SearchFilters } from '../../hooks/useOfficialSearches';

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void;
  loading: boolean;
}

interface CooperativeType {
  id: string;
  name: string;
  category: string;
}

interface County {
  id: string;
  name: string;
}

export default function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [cooperativeTypes, setCooperativeTypes] = useState<CooperativeType[]>([]);
  const [counties, setCounties] = useState<County[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    const [typesResult, countiesResult] = await Promise.all([
      supabase.from('cooperative_types').select('id, name, category').order('name'),
      supabase.from('tenants').select('id, name').eq('type', 'COUNTY').order('name')
    ]);

    if (typesResult.data) setCooperativeTypes(typesResult.data);
    if (countiesResult.data) setCounties(countiesResult.data);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({});
    onSearch({});
  };

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Search Cooperatives</h3>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-red-600 hover:text-red-700 flex items-center space-x-1"
        >
          <Filter className="h-4 w-4" />
          <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Filters</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cooperative Name
            </label>
            <input
              type="text"
              value={filters.cooperativeName || ''}
              onChange={(e) => updateFilter('cooperativeName', e.target.value)}
              placeholder="Enter cooperative name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registration Number
            </label>
            <input
              type="text"
              value={filters.registrationNumber || ''}
              onChange={(e) => updateFilter('registrationNumber', e.target.value)}
              placeholder="Enter registration number..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                County
              </label>
              <select
                value={filters.countyId || ''}
                onChange={(e) => updateFilter('countyId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Counties</option>
                {counties.map(county => (
                  <option key={county.id} value={county.id}>
                    {county.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cooperative Type
              </label>
              <select
                value={filters.typeId || ''}
                onChange={(e) => updateFilter('typeId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Types</option>
                {cooperativeTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="DISSOLVED">Dissolved</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Date From
              </label>
              <input
                type="date"
                value={filters.registrationDateFrom || ''}
                onChange={(e) => updateFilter('registrationDateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Date To
              </label>
              <input
                type="date"
                value={filters.registrationDateTo || ''}
                onChange={(e) => updateFilter('registrationDateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        )}

        <div className="flex items-center space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
          >
            <Search className="h-5 w-5" />
            <span>{loading ? 'Searching...' : 'Search'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </form>
  );
}
