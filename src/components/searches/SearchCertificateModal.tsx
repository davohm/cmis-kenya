import { useState } from 'react';
import { X, CreditCard, Smartphone, Loader, CheckCircle, Download, AlertCircle } from 'lucide-react';
import { Cooperative } from '../../hooks/useCooperatives';
import { useOfficialSearches, CertificateRequestData } from '../../hooks/useOfficialSearches';
import { useAuth } from '../../contexts/AuthContext';

interface SearchCertificateModalProps {
  cooperative: Cooperative;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SearchCertificateModal({
  cooperative,
  onClose,
  onSuccess
}: SearchCertificateModalProps) {
  const { user } = useAuth();
  const { createCertificateRequest, generateCertificate } = useOfficialSearches();
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'CARD'>('MPESA');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [certificateGenerated, setCertificateGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CertificateRequestData>({
    cooperative_id: cooperative.id,
    requester_name: '',
    requester_id_number: '',
    requester_email: '',
    requester_phone: '',
    purpose: '',
    payment_method: 'MPESA'
  });

  const [mpesaData, setMpesaData] = useState({
    phone: '',
    mpesaCode: ''
  });

  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const [searchRequest, setSearchRequest] = useState<any>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.requester_name || !formData.requester_id_number || !formData.purpose) {
      setError('Please fill in all required fields');
      return;
    }
    setError(null);
    setStep('payment');
  };

  const handlePayment = async () => {
    try {
      setProcessingPayment(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 2000));

      const requestData = {
        ...formData,
        payment_method: paymentMethod
      };

      const request = await createCertificateRequest(requestData, user?.id);
      setSearchRequest(request);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      setCertificateGenerated(true);
      await generateCertificate(searchRequest, cooperative);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError('Failed to generate certificate. Please try again.');
      setCertificateGenerated(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Request Official Certificate</h2>
            <p className="text-sm text-gray-600 mt-1">{cooperative.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {step === 'form' && (
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Official Search Fee:</strong> KES 500.00
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-500 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Requester Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.requester_name}
                      onChange={(e) => setFormData({ ...formData, requester_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID/Passport Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.requester_id_number}
                      onChange={(e) => setFormData({ ...formData, requester_id_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.requester_email}
                        onChange={(e) => setFormData({ ...formData, requester_email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.requester_phone}
                        onChange={(e) => setFormData({ ...formData, requester_phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purpose of Search <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="e.g., Due diligence, Legal proceedings, Business partnership..."
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Proceed to Payment
                </button>
              </div>
            </form>
          )}

          {step === 'payment' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Payment Summary</h3>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Official Search Certificate</span>
                  <span className="text-xl font-bold text-gray-900">KES 500.00</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-500 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('MPESA')}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                      paymentMethod === 'MPESA'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Smartphone className={`h-8 w-8 ${paymentMethod === 'MPESA' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="font-semibold">M-PESA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                      paymentMethod === 'CARD'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className={`h-8 w-8 ${paymentMethod === 'CARD' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="font-semibold">Credit/Debit Card</span>
                  </button>
                </div>

                {paymentMethod === 'MPESA' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        M-PESA Phone Number
                      </label>
                      <input
                        type="tel"
                        value={mpesaData.phone}
                        onChange={(e) => setMpesaData({ ...mpesaData, phone: e.target.value })}
                        placeholder="07XXXXXXXX"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        Enter your M-PESA number to receive a payment prompt on your phone.
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'CARD' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardData.cardNumber}
                        onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          value={cardData.expiry}
                          onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                          placeholder="MM/YY"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cardData.cvv}
                          onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                          placeholder="123"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  disabled={processingPayment}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={processingPayment}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
                >
                  {processingPayment ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Pay KES 500.00</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && searchRequest && (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                <p className="text-gray-600">Your certificate request has been processed</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Search Reference:</span>
                  <span className="font-mono font-semibold text-gray-900">{searchRequest.search_number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Payment Reference:</span>
                  <span className="font-mono font-semibold text-gray-900">{searchRequest.payment_reference}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Amount Paid:</span>
                  <span className="font-semibold text-gray-900">KES 500.00</span>
                </div>
              </div>

              <button
                onClick={handleDownloadCertificate}
                disabled={certificateGenerated}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
              >
                {certificateGenerated ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>Certificate Downloaded</span>
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    <span>Download Certificate</span>
                  </>
                )}
              </button>

              <p className="text-sm text-gray-500 text-center">
                The certificate has been saved to your downloads folder
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
