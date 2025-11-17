import { useState } from 'react';
import { X, Shield, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useIPRSVerification } from '../../hooks/useIntegrations';
import { IPRSRecord } from '../../services/mockIPRS';
import { useAuth } from '../../contexts/AuthContext';

interface IDVerificationModalProps {
  onClose: () => void;
  onVerified: (record: IPRSRecord) => void;
  initialIdNumber?: string;
}

export default function IDVerificationModal({ onClose, onVerified, initialIdNumber = '' }: IDVerificationModalProps) {
  const [idNumber, setIdNumber] = useState(initialIdNumber);
  const { verifyID, loading, error, data } = useIPRSVerification();
  const { user } = useAuth();

  const handleVerify = async () => {
    const result = await verifyID(idNumber, user?.id);
    if (result.success && result.data) {
      setTimeout(() => {
        onVerified(result.data!);
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">IPRS Verification</h3>
              <p className="text-sm text-gray-600">Integrated Population Registration System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              National ID Number
            </label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="Enter 8-digit ID number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
              maxLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter your 8-digit national ID number
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Verification Failed</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {data && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Verification Successful</p>
                  <p className="text-sm text-green-700 mt-1">ID verified with IPRS</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Full Name:</span>
                  <span className="text-sm font-medium text-gray-900">{data.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ID Number:</span>
                  <span className="text-sm font-medium text-gray-900">{data.id_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Date of Birth:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(data.date_of_birth).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gender:</span>
                  <span className="text-sm font-medium text-gray-900">{data.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className="text-sm font-medium text-green-600">{data.validation_status}</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={loading || idNumber.length !== 8}
            className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Verifying with IPRS...</span>
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                <span>Verify with IPRS</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
