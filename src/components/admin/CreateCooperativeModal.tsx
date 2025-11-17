import { X, Building2, FileText, MapPin, Mail, Phone, Users, DollarSign, Calendar, Hash, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCooperativeCRUD, CooperativeType, Tenant } from '../../hooks/useCooperativeCRUD';

interface CreateCooperativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCooperativeModal({
  isOpen,
  onClose,
  onSuccess
}: CreateCooperativeModalProps) {
  const { createCooperative, loadCooperativeTypes, loadCounties, generateRegistrationNumber, loading } = useCooperativeCRUD();
  const [cooperativeTypes, setCooperativeTypes] = useState<CooperativeType[]>([]);
  const [counties, setCounties] = useState<Tenant[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    registration_number: '',
    type_id: '',
    tenant_id: '',
    registration_date: new Date().toISOString().split('T')[0],
    address: '',
    postal_address: '',
    email: '',
    phone: '',
    total_members: 0,
    total_share_capital: 0
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [generatingRegNumber, setGeneratingRegNumber] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    } else {
      resetForm();
    }
  }, [isOpen]);

  const loadData = async () => {
    const [types, countiesData] = await Promise.all([
      loadCooperativeTypes(),
      loadCounties()
    ]);
    setCooperativeTypes(types);
    setCounties(countiesData);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      registration_number: '',
      type_id: '',
      tenant_id: '',
      registration_date: new Date().toISOString().split('T')[0],
      address: '',
      postal_address: '',
      email: '',
      phone: '',
      total_members: 0,
      total_share_capital: 0
    });
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleAutoGenerateRegNumber = async () => {
    if (!formData.tenant_id) {
      setErrorMessage('Please select a county first');
      return;
    }

    try {
      setGeneratingRegNumber(true);
      setErrorMessage('');
      const regNumber = await generateRegistrationNumber(formData.tenant_id);
      setFormData({ ...formData, registration_number: regNumber });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate registration number');
    } finally {
      setGeneratingRegNumber(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.registration_number || !formData.type_id || !formData.tenant_id || 
        !formData.registration_date || !formData.address || !formData.email || !formData.phone) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    try {
      setErrorMessage('');
      await createCooperative({
        name: formData.name,
        registration_number: formData.registration_number,
        type_id: formData.type_id,
        tenant_id: formData.tenant_id,
        registration_date: formData.registration_date,
        address: formData.address,
        postal_address: formData.postal_address || undefined,
        email: formData.email,
        phone: formData.phone,
        total_members: formData.total_members,
        total_share_capital: formData.total_share_capital
      });

      setSuccessMessage(`Successfully created cooperative: ${formData.name}`);
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create cooperative');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Create New Cooperative</h2>
            <p className="text-red-100 text-sm mt-1">Register a new cooperative society manually</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-red-800 p-2 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-semibold">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{errorMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Building2 className="inline h-4 w-4 mr-2" />
                Cooperative Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., Nairobi Farmers Cooperative Society"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-2" />
                County *
              </label>
              <select
                value={formData.tenant_id}
                onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value, registration_number: '' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
                disabled={loading}
              >
                <option value="">Select County</option>
                {counties.map((county) => (
                  <option key={county.id} value={county.id}>
                    {county.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-2" />
                Cooperative Type *
              </label>
              <select
                value={formData.type_id}
                onChange={(e) => setFormData({ ...formData, type_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
                disabled={loading}
              >
                <option value="">Select Type</option>
                {cooperativeTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Hash className="inline h-4 w-4 mr-2" />
                Registration Number *
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value.toUpperCase() })}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="COOP/NRB001/2025/0001"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleAutoGenerateRegNumber}
                  disabled={!formData.tenant_id || generatingRegNumber || loading}
                  className="px-4 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors font-semibold disabled:opacity-50 flex items-center space-x-2"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{generatingRegNumber ? 'Generating...' : 'Auto-Generate'}</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Format: COOP/COUNTY_CODE/YYYY/XXXX</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-2" />
                Registration Date *
              </label>
              <input
                type="date"
                value={formData.registration_date}
                onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-2" />
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="cooperative@example.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Phone className="inline h-4 w-4 mr-2" />
                Phone *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="+254 700 000 000"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Building2 className="inline h-4 w-4 mr-2" />
                Postal Address
              </label>
              <input
                type="text"
                value={formData.postal_address}
                onChange={(e) => setFormData({ ...formData, postal_address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="P.O. Box 12345-00100, Nairobi"
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-2" />
                Physical Address *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter the physical address of the cooperative"
                rows={3}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Users className="inline h-4 w-4 mr-2" />
                Total Members
              </label>
              <input
                type="number"
                value={formData.total_members}
                onChange={(e) => setFormData({ ...formData, total_members: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="0"
                min="0"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <DollarSign className="inline h-4 w-4 mr-2" />
                Total Share Capital (KES)
              </label>
              <input
                type="number"
                value={formData.total_share_capital}
                onChange={(e) => setFormData({ ...formData, total_share_capital: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Cooperative'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
