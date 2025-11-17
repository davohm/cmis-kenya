import { ArrowLeft, Building2, MapPin, Mail, Phone, Users, DollarSign, Calendar, Shield, FileText } from 'lucide-react';
import { Cooperative } from '../../hooks/useCooperatives';

interface CooperativeDetailViewProps {
  cooperative: Cooperative;
  onBack: () => void;
  onGetCertificate: () => void;
}

export default function CooperativeDetailView({
  cooperative,
  onBack,
  onGetCertificate
}: CooperativeDetailViewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'DISSOLVED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'SUSPENDED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'INACTIVE':
        return 'bg-gray-400';
      default:
        return 'bg-yellow-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Results</span>
        </button>
        <button
          onClick={onGetCertificate}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
        >
          <FileText className="h-5 w-5" />
          <span>Get Official Certificate</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="bg-gradient-to-r from-red-600 to-green-700 p-6 rounded-t-lg">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{cooperative.name}</h2>
              <p className="text-gray-100">Registration No: {cooperative.registration_number || 'N/A'}</p>
            </div>
            <span className={`px-4 py-2 rounded-full font-semibold border ${getStatusColor(cooperative.status)}`}>
              {cooperative.status}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="text-sm font-medium text-gray-900">
                      {cooperative.cooperative_types?.name || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">County</p>
                    <p className="text-sm font-medium text-gray-900">
                      {cooperative.tenants?.name || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Registration Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {cooperative.registration_date 
                        ? new Date(cooperative.registration_date).toLocaleDateString('en-GB')
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Compliance Status</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className={`h-3 w-3 rounded-full ${getComplianceColor(cooperative.status)}`} />
                      <p className="text-sm font-medium text-gray-900">
                        {cooperative.status === 'ACTIVE' ? 'Compliant' : 'Non-Compliant'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Registered Office Address</p>
                    <p className="text-sm font-medium text-gray-900">
                      {cooperative.address || 'Not provided'}
                    </p>
                    {cooperative.postal_address && (
                      <p className="text-sm text-gray-600 mt-1">
                        P.O. Box {cooperative.postal_address}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">
                      {cooperative.email || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">
                      {cooperative.phone || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-600 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Members</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {cooperative.total_members.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-600 p-3 rounded-lg">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Share Capital</p>
                    <p className="text-2xl font-bold text-gray-900">
                      KES {cooperative.total_share_capital.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                This information is extracted from official records maintained by the State Department for Cooperatives, 
                Republic of Kenya. For an official certified copy of this information, please request an Official Search Certificate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
