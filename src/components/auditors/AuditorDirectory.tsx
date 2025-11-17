import { useState } from 'react';
import { Search, Filter, Award, Briefcase, Star, Phone, Mail, Shield } from 'lucide-react';
import { 
  useAuditorDirectory, 
  AuditorProfile,
  AuditorQualification,
  AuditorSpecialization 
} from '../../hooks/useAuditorRegistration';

interface AuditorDirectoryProps {
  onSelectAuditor?: (auditor: AuditorProfile) => void;
}

export default function AuditorDirectory({ onSelectAuditor }: AuditorDirectoryProps) {
  const [qualificationFilter, setQualificationFilter] = useState<AuditorQualification | 'ALL'>('ALL');
  const [specializationFilter, setSpecializationFilter] = useState<AuditorSpecialization | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuditor, setSelectedAuditor] = useState<AuditorProfile | null>(null);
  const [page] = useState(1);

  const { auditors, loading, error, totalCount } = useAuditorDirectory(
    {
      qualification: qualificationFilter,
      specialization: specializationFilter,
      search: searchQuery
    },
    page,
    12
  );

  const getQualificationLabel = (qualification: AuditorQualification) => {
    const labels = {
      CERTIFIED_PUBLIC_ACCOUNTANT: 'CPA',
      CHARTERED_ACCOUNTANT: 'CA',
      COOPERATIVE_AUDITOR: 'Cooperative Auditor',
      OTHER: 'Other'
    };
    return labels[qualification];
  };

  const getQualificationIcon = (qualification: AuditorQualification) => {
    return qualification === 'CERTIFIED_PUBLIC_ACCOUNTANT' || qualification === 'CHARTERED_ACCOUNTANT'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-green-100 text-green-800';
  };

  const handleAuditorClick = (auditor: AuditorProfile) => {
    setSelectedAuditor(auditor);
    if (onSelectAuditor) {
      onSelectAuditor(auditor);
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

  if (selectedAuditor) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedAuditor(null)}
          className="text-red-600 hover:text-red-700 font-medium"
        >
          ← Back to Directory
        </button>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-8">
            <div className="flex items-start space-x-6">
              <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center">
                {selectedAuditor.photo_url ? (
                  <img
                    src={selectedAuditor.photo_url}
                    alt={selectedAuditor.full_name}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <Shield className="h-12 w-12 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{selectedAuditor.full_name}</h2>
                <p className="text-red-100 mt-1">
                  {getQualificationLabel(selectedAuditor.qualification)} • {selectedAuditor.certification_body}
                </p>
                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex items-center text-white">
                    <Star className="h-4 w-4 mr-1 fill-current" />
                    <span className="text-sm">{selectedAuditor.average_rating.toFixed(1)}</span>
                  </div>
                  <div className="text-red-100 text-sm">
                    {selectedAuditor.total_audits_completed} Audits Completed
                  </div>
                  <div className="text-red-100 text-sm">
                    {selectedAuditor.cooperatives_audited} Cooperatives
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {selectedAuditor.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {selectedAuditor.phone}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Professional Details</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Award className="h-4 w-4 mr-2 text-gray-400" />
                    Certificate: {selectedAuditor.certificate_number}
                  </div>
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                    {selectedAuditor.years_experience} years experience
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Specializations</h3>
              <div className="flex flex-wrap gap-2">
                {selectedAuditor.specializations.map((spec) => (
                  <span
                    key={spec}
                    className="inline-block px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full"
                  >
                    {spec.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Performance Metrics</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{selectedAuditor.total_audits_completed}</div>
                  <div className="text-xs text-gray-600 mt-1">Total Audits</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{selectedAuditor.cooperatives_audited}</div>
                  <div className="text-xs text-gray-600 mt-1">Cooperatives</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{selectedAuditor.average_rating.toFixed(1)}</div>
                  <div className="text-xs text-gray-600 mt-1">Avg Rating</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button className="w-full px-6 py-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
                Contact Auditor
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search auditors by name, certificate, or body..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={qualificationFilter}
              onChange={(e) => setQualificationFilter(e.target.value as AuditorQualification | 'ALL')}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="ALL">All Qualifications</option>
              <option value="CERTIFIED_PUBLIC_ACCOUNTANT">CPA</option>
              <option value="CHARTERED_ACCOUNTANT">CA</option>
              <option value="COOPERATIVE_AUDITOR">Cooperative Auditor</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <select
            value={specializationFilter}
            onChange={(e) => setSpecializationFilter(e.target.value as AuditorSpecialization | 'ALL')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="ALL">All Specializations</option>
            <option value="SACCO">SACCO</option>
            <option value="AGRICULTURAL">Agricultural</option>
            <option value="TRANSPORT">Transport</option>
            <option value="HOUSING">Housing</option>
            <option value="CONSUMER">Consumer</option>
            <option value="MARKETING">Marketing</option>
            <option value="DAIRY">Dairy</option>
            <option value="SAVINGS">Savings</option>
            <option value="MULTIPURPOSE">Multipurpose</option>
          </select>
        </div>
      </div>

      {auditors.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Auditors Found</h3>
          <p className="text-sm text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auditors.map((auditor) => (
              <div
                key={auditor.id}
                onClick={() => handleAuditorClick(auditor)}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        {auditor.photo_url ? (
                          <img
                            src={auditor.photo_url}
                            alt={auditor.full_name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <Shield className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{auditor.full_name}</h3>
                        <p className="text-sm text-gray-600">{auditor.certification_body}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${getQualificationIcon(auditor.qualification)}`}>
                      {getQualificationLabel(auditor.qualification)}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                        <span>{auditor.average_rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-1 text-gray-400" />
                        <span>{auditor.years_experience} yrs</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {auditor.specializations.slice(0, 3).map((spec) => (
                          <span
                            key={spec}
                            className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {spec}
                          </span>
                        ))}
                        {auditor.specializations.length > 3 && (
                          <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                            +{auditor.specializations.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        <div>{auditor.total_audits_completed} audits completed</div>
                        <div className="text-xs text-gray-500 mt-1">Cert: {auditor.certificate_number}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                  <button className="w-full text-sm font-medium text-red-600 hover:text-red-700">
                    View Profile →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalCount > auditors.length && (
            <div className="text-center">
              <button className="px-6 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50">
                Load More Auditors
              </button>
            </div>
          )}
        </>
      )}

      {totalCount > 0 && (
        <div className="bg-gray-50 px-6 py-3 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            Showing {auditors.length} of {totalCount} certified auditors
          </p>
        </div>
      )}
    </div>
  );
}
