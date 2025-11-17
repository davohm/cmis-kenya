import { useState } from 'react';
import { X, CreditCard, Smartphone, CheckCircle, AlertCircle, Loader, Download } from 'lucide-react';
import { useECitizenPayment } from '../../hooks/useIntegrations';
import { PaymentMethod } from '../../services/mockECitizen';
import { jsPDF } from 'jspdf';

interface PaymentGatewayModalProps {
  onClose: () => void;
  onSuccess: (transactionRef: string, receiptNumber: string) => void;
  serviceType: string;
  amount: number;
  description: string;
}

export default function PaymentGatewayModal({ 
  onClose, 
  onSuccess, 
  serviceType, 
  amount,
  description 
}: PaymentGatewayModalProps) {
  const [step, setStep] = useState<'method' | 'details' | 'processing' | 'success'>('method');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MPESA');
  const [payerName, setPayerName] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  
  const { initiatePayment, processPayment, loading, error, transaction } = useECitizenPayment();

  const handleMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setStep('details');
  };

  const handleProceedToPay = async () => {
    const payerDetails = {
      name: payerName,
      phone: payerPhone,
      email: payerEmail,
      mpesaNumber: paymentMethod === 'MPESA' ? mpesaNumber : undefined,
      cardLastFour: paymentMethod === 'CARD' ? cardNumber.slice(-4) : undefined
    };

    const initResult = await initiatePayment(serviceType, amount, paymentMethod, payerDetails);
    
    if (initResult.success && initResult.data) {
      setStep('processing');
      
      const processResult = await processPayment(initResult.data.bill_reference);
      
      if (processResult.success && processResult.data) {
        setStep('success');
        onSuccess(processResult.data.bill_reference, processResult.data.receipt_number || '');
      }
    }
  };

  const generateReceipt = () => {
    if (!transaction || !transaction.receipt_number) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFillColor(139, 0, 0);
    pdf.rect(0, 0, pageWidth, 40, 'F');

    pdf.setFillColor(0, 100, 0);
    pdf.rect(0, 40, pageWidth, 3, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('REPUBLIC OF KENYA', pageWidth / 2, 20, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text('eCitizen Payment Receipt', pageWidth / 2, 32, { align: 'center' });

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    
    let yPos = 60;
    pdf.text(`Receipt Number: ${transaction.receipt_number}`, 20, yPos);
    yPos += 10;
    pdf.text(`Bill Reference: ${transaction.bill_reference}`, 20, yPos);
    yPos += 10;
    pdf.text(`Date: ${new Date().toLocaleString()}`, 20, yPos);
    yPos += 20;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment Details', 20, yPos);
    pdf.setFont('helvetica', 'normal');
    yPos += 10;

    pdf.setFontSize(10);
    pdf.text(`Service: ${serviceType}`, 20, yPos);
    yPos += 8;
    pdf.text(`Amount: KES ${amount.toLocaleString()}`, 20, yPos);
    yPos += 8;
    pdf.text(`Payment Method: ${paymentMethod}`, 20, yPos);
    yPos += 8;
    pdf.text(`Payer: ${payerName}`, 20, yPos);
    yPos += 8;
    pdf.text(`Status: COMPLETED`, 20, yPos);

    yPos += 20;
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('This is an official receipt from the Government of Kenya eCitizen platform.', pageWidth / 2, yPos, { align: 'center' });

    pdf.save(`Receipt-${transaction.receipt_number}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-green-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">eCitizen Payment</h3>
              <p className="text-sm opacity-90">Government of Kenya</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 bg-white bg-opacity-20 rounded-lg p-3">
            <p className="text-sm opacity-90">Amount to Pay</p>
            <p className="text-2xl font-bold">KES {amount.toLocaleString()}</p>
            <p className="text-xs opacity-75 mt-1">{description}</p>
          </div>
        </div>

        <div className="p-6">
          {step === 'method' && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 mb-4">Select Payment Method</h4>
              
              <button
                onClick={() => handleMethodSelect('MPESA')}
                className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-6 w-6 text-green-600" />
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">M-Pesa</p>
                    <p className="text-sm text-gray-600">Pay via M-Pesa</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleMethodSelect('CARD')}
                className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Debit/Credit Card</p>
                    <p className="text-sm text-gray-600">Visa, Mastercard</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('method')}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                ← Change Payment Method
              </button>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  placeholder="+254..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              {paymentMethod === 'MPESA' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    M-Pesa Number
                  </label>
                  <input
                    type="tel"
                    value={mpesaNumber}
                    onChange={(e) => setMpesaNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                    placeholder="+254..."
                  />
                </div>
              )}

              {paymentMethod === 'CARD' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={cardCVV}
                        onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="123"
                      />
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleProceedToPay}
                disabled={loading || !payerName || !payerPhone || !payerEmail}
                className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Initiating Payment...' : 'Proceed to Pay'}
              </button>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <Loader className="h-12 w-12 text-red-600 animate-spin mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Processing Payment</h4>
              <p className="text-gray-600">Please wait while we process your payment...</p>
            </div>
          )}

          {step === 'success' && transaction && (
            <div className="text-center space-y-4">
              <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h4>
                <p className="text-gray-600">Your payment has been processed successfully</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Receipt Number:</span>
                  <span className="text-sm font-medium text-gray-900">{transaction.receipt_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bill Reference:</span>
                  <span className="text-sm font-medium text-gray-900">{transaction.bill_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount Paid:</span>
                  <span className="text-sm font-medium text-gray-900">KES {amount.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={generateReceipt}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="h-5 w-5" />
                <span>Download Receipt</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
