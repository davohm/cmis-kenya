import { useState } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, Clock, Loader } from 'lucide-react';
import { useKRAVerification } from '../../hooks/useIntegrations';
import { useAuth } from '../../contexts/AuthContext';

interface KRAPINVerificationProps {
  onVerified?: (kraPin: string, taxpayerName: string, complianceStatus: string) => void;
}

export default function KRAPINVerification({ onVerified }: KRAPINVerificationProps) {
  const [kraPin, setKraPin] = useState('');
  const { verifyPIN, loading, error, data, reset } = useKRAVerification();
  const { user } = useAuth();

  const handleVerify = async () => {
    const result = await verifyPIN(kraPin, user?.id);
    if (result.success && result.data && onVerified) {
      onVerified(result.data.kra_pin, result.data.taxpayer_name, result.data.compliance_status);
    }
  };

  const handleReset = () => {
    setKraPin('');
    reset();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'NON_COMPLIANT':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'PENDING':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return <CheckCircle className="h-5 w-5" />;
      case 'NON_COMPLIANT':
        return <AlertTriangle className="h-5 w-5" />;
      case 'PENDING':
        return <XCircle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-red-600 p-2 rounded-lg">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">KRA Tax Verification</h3>
          <p className="text-sm text-gray-600">Kenya Revenue Authority iTax System</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            KRA PIN Number
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={kraPin}
              onChange={(e) => setKraPin(e.target.value.toUpperCase())}
              placeholder="A000000000A"
              maxLength={11}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
            <button
              onClick={handleVerify}
              disabled={loading || kraPin.length !== 11}
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify</span>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Format: A000000000A (Letter + 9 digits + Letter)
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Verification Failed</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {data && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Taxpayer Information</h4>
                <button
                  onClick={handleReset}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">KRA PIN:</span>
                  <span className="text-sm font-medium text-gray-900">{data.kra_pin}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Taxpayer Name:</span>
                  <span className="text-sm font-medium text-gray-900">{data.taxpayer_name}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Compliance Status:</span>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full border flex items-center space-x-1 ${getStatusColor(data.compliance_status)}`}>
                    {getStatusIcon(data.compliance_status)}
                    <span>{data.compliance_status}</span>
                  </span>
                </div>

                {data.outstanding_tax_amount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Outstanding Tax:</span>
                    <span className="text-sm font-bold text-red-600">
                      KES {data.outstanding_tax_amount.toLocaleString()}
                    </span>
                  </div>
                )}

                {data.last_filing_date && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Filing Date:</span>
                    <span className="text-sm font-medium text-gray-900 flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(data.last_filing_date).toLocaleDateString()}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Tax Obligations</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Value Added Tax (VAT)</span>
                  <span className={`text-sm font-medium ${data.vat_obligation ? 'text-green-600' : 'text-gray-400'}`}>
                    {data.vat_obligation ? '✓ Active' : '✗ Not Active'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Pay As You Earn (PAYE)</span>
                  <span className={`text-sm font-medium ${data.paye_obligation ? 'text-green-600' : 'text-gray-400'}`}>
                    {data.paye_obligation ? '✓ Active' : '✗ Not Active'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Corporation Tax</span>
                  <span className={`text-sm font-medium ${data.corporation_tax_obligation ? 'text-green-600' : 'text-gray-400'}`}>
                    {data.corporation_tax_obligation ? '✓ Active' : '✗ Not Active'}
                  </span>
                </div>
              </div>
            </div>

            {data.compliance_status === 'COMPLIANT' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Tax Compliant</p>
                    <p className="text-sm text-green-700 mt-1">
                      This taxpayer is fully compliant with KRA requirements
                    </p>
                  </div>
                </div>
              </div>
            )}

            {data.compliance_status === 'NON_COMPLIANT' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Non-Compliant Status</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Outstanding tax obligations must be cleared
                    </p>
                  </div>
                </div>
              </div>
            )}

            {data.compliance_status === 'PENDING' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Verification Pending</p>
                    <p className="text-sm text-red-700 mt-1">
                      KRA verification is pending. Please check back later
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
