import { useState } from 'react';
import { Shield, TrendingUp, AlertCircle, CheckCircle, Building2, User, Mail, Phone, Loader } from 'lucide-react';
import { useSASRACompliance } from '../../hooks/useIntegrations';
import { useAuth } from '../../contexts/AuthContext';

interface SASRALicenseCheckProps {
  cooperativeId: string;
  onVerified?: (licenseNumber: string | undefined, status: string) => void;
}

export default function SASRALicenseCheck({ cooperativeId, onVerified }: SASRALicenseCheckProps) {
  const { checkLicense, loading, error, data } = useSASRACompliance();
  const { user } = useAuth();
  const [checked, setChecked] = useState(false);

  const handleCheck = async () => {
    const result = await checkLicense(cooperativeId, user?.id);
    if (result.success && result.data && onVerified) {
      onVerified(result.data.license_number, result.data.license_status);
    }
    setChecked(true);
  };

  const getLicenseStatusColor = (status: string) => {
    switch (status) {
      case 'LICENSED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SUSPENDED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'EXPIRED':
      case 'NOT_LICENSED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatioStatus = (ratio: number, type: 'car' | 'liquidity' | 'npl') => {
    if (type === 'car') {
      if (ratio >= 10) return { color: 'text-green-600', status: 'Good' };
      if (ratio >= 8) return { color: 'text-yellow-600', status: 'Adequate' };
      return { color: 'text-red-600', status: 'Below Minimum' };
    }
    if (type === 'liquidity') {
      if (ratio >= 15) return { color: 'text-green-600', status: 'Good' };
      if (ratio >= 10) return { color: 'text-yellow-600', status: 'Adequate' };
      return { color: 'text-red-600', status: 'Below Minimum' };
    }
    if (type === 'npl') {
      if (ratio <= 5) return { color: 'text-green-600', status: 'Good' };
      if (ratio <= 10) return { color: 'text-yellow-600', status: 'Watch' };
      return { color: 'text-red-600', status: 'High Risk' };
    }
    return { color: 'text-gray-600', status: 'N/A' };
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-red-600 p-2 rounded-lg">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">SASRA Compliance Check</h3>
          <p className="text-sm text-gray-600">SACCO Societies Regulatory Authority</p>
        </div>
      </div>

      {!checked && (
        <div className="text-center py-8">
          <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Shield className="h-8 w-8 text-gray-600" />
          </div>
          <p className="text-gray-600 mb-4">Check SACCO compliance status with SASRA</p>
          <button
            onClick={handleCheck}
            disabled={loading}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 mx-auto"
          >
            {loading ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Checking Compliance...</span>
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                <span>Check SASRA Compliance</span>
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Compliance Check Failed</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {checked && data && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 mb-1">License Status</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getLicenseStatusColor(data.license_status)}`}>
                {data.license_status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Compliance Score</p>
              <div className="flex items-center space-x-2">
                <span className={`text-2xl font-bold ${getComplianceColor(data.compliance_score)}`}>
                  {data.compliance_score}
                </span>
                <span className="text-gray-500">/100</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="h-5 w-5 text-gray-700" />
              <h4 className="font-semibold text-gray-900">Compliance Score</h4>
            </div>
            <div className="relative">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    data.compliance_score >= 80 ? 'bg-green-600' :
                    data.compliance_score >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${data.compliance_score}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-600">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4">Financial Ratios</h4>
            <div className="space-y-4">
              {data.capital_adequacy_ratio !== undefined && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-700">Capital Adequacy Ratio (CAR)</span>
                    <span className={`text-sm font-bold ${getRatioStatus(data.capital_adequacy_ratio, 'car').color}`}>
                      {data.capital_adequacy_ratio.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Minimum: 10%</span>
                    <span className={`text-xs font-medium ${getRatioStatus(data.capital_adequacy_ratio, 'car').color}`}>
                      {getRatioStatus(data.capital_adequacy_ratio, 'car').status}
                    </span>
                  </div>
                </div>
              )}

              {data.liquidity_ratio !== undefined && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-700">Liquidity Ratio</span>
                    <span className={`text-sm font-bold ${getRatioStatus(data.liquidity_ratio, 'liquidity').color}`}>
                      {data.liquidity_ratio.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Minimum: 15%</span>
                    <span className={`text-xs font-medium ${getRatioStatus(data.liquidity_ratio, 'liquidity').color}`}>
                      {getRatioStatus(data.liquidity_ratio, 'liquidity').status}
                    </span>
                  </div>
                </div>
              )}

              {data.npl_ratio !== undefined && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-700">Non-Performing Loans (NPL) Ratio</span>
                    <span className={`text-sm font-bold ${getRatioStatus(data.npl_ratio, 'npl').color}`}>
                      {data.npl_ratio.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Maximum: 5%</span>
                    <span className={`text-xs font-medium ${getRatioStatus(data.npl_ratio, 'npl').color}`}>
                      {getRatioStatus(data.npl_ratio, 'npl').status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {data.last_audit_date && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Last Audit Completed</p>
                  <p className="text-sm text-blue-700 mt-1">
                    {new Date(data.last_audit_date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {data.regulatory_alerts && data.regulatory_alerts.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 mb-2">Regulatory Alerts</p>
                  <ul className="space-y-1">
                    {data.regulatory_alerts.map((alert, index) => (
                      <li key={index} className="text-sm text-yellow-700">• {alert}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {data.supervisor_name && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">SASRA Supervisor</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-900">{data.supervisor_name}</span>
                </div>
                {data.supervisor_email && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-600" />
                    <a href={`mailto:${data.supervisor_email}`} className="text-red-600 hover:text-red-700">
                      {data.supervisor_email}
                    </a>
                  </div>
                )}
                {data.supervisor_phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-600" />
                    <a href={`tel:${data.supervisor_phone}`} className="text-red-600 hover:text-red-700">
                      {data.supervisor_phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
