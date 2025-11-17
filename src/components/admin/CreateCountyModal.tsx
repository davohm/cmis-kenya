import { X, MapPin, Mail, Phone, FileText, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCountyCRUD } from '../../hooks/useCountyCRUD';

interface CreateCountyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCountyModal({
  isOpen,
  onClose,
  onSuccess
}: CreateCountyModalProps) {
  const { createCounty, loading } = useCountyCRUD();
  const [formData, setFormData] = useState({
    name: '',
    county_code: '',
    contact_email: '',
    contact_phone: '',
    address: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        county_code: '',
        contact_email: '',
        contact_phone: '',
        address: ''
      });
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.county_code || !formData.contact_email || !formData.contact_phone) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contact_email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    try {
      setErrorMessage('');
      await createCounty({
        name: formData.name,
        county_code: formData.county_code,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        address: formData.address || undefined
      });

      setSuccessMessage(`Successfully created county: ${formData.name}`);
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create county');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Create New County</h2>
            <p className="text-red-100 text-sm mt-1">Add a new county to the system</p>
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

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Building2 className="inline h-4 w-4 mr-2" />
                County Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., Nairobi County"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-2" />
                County Code *
              </label>
              <input
                type="text"
                value={formData.county_code}
                onChange={(e) => setFormData({ ...formData, county_code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., NRB001"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">Unique identifier for the county</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-2" />
                Contact Email *
              </label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="county@example.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Phone className="inline h-4 w-4 mr-2" />
                Contact Phone *
              </label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="+254 700 000 000"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-2" />
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter county office address (optional)"
                rows={3}
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
              {loading ? 'Creating...' : 'Create County'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
