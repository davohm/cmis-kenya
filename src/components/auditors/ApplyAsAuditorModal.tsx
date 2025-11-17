import { useState } from 'react';
import { X, Upload, FileText, Briefcase, Award, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  useAuditorActions, 
  AuditorQualification, 
  AuditorSpecialization,
  SubmitApplicationData 
} from '../../hooks/useAuditorRegistration';
import { useDocumentUpload } from '../../hooks/useDocumentUpload';

interface ApplyAsAuditorModalProps {
  onClose: () => void;
  onSuccess: (applicationNumber: string) => void;
}

export default function ApplyAsAuditorModal({ onClose, onSuccess }: ApplyAsAuditorModalProps) {
  const { profile } = useAuth();
  const { submitApplication, submitting } = useAuditorActions();
  const { uploadDocument, uploading, validateFile } = useDocumentUpload();

  const [formData, setFormData] = useState<SubmitApplicationData>({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    id_number: '',
    qualification: 'CERTIFIED_PUBLIC_ACCOUNTANT',
    certification_body: '',
    certificate_number: '',
    certificate_issue_date: '',
    years_experience: 0,
    specializations: [],
    professional_certificate_url: '',
    academic_certificates_url: '',
    practicing_certificate_url: '',
    id_copy_url: '',
    cv_url: '',
    terms_accepted: false,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const specializations: AuditorSpecialization[] = [
    'SACCO', 'AGRICULTURAL', 'TRANSPORT', 'HOUSING', 
    'CONSUMER', 'MARKETING', 'DAIRY', 'SAVINGS', 'MULTIPURPOSE'
  ];

  const handleSpecializationToggle = (spec: AuditorSpecialization) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  const handleFileUpload = async (file: File, documentType: string) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError.message);
      return;
    }

    setUploadingDoc(documentType);
    setError(null);

    try {
      const tempApplicationId = `temp_${Date.now()}`;
      const result = await uploadDocument(file, tempApplicationId, 'bylaws' as any);
      
      setFormData(prev => ({
        ...prev,
        [`${documentType}_url`]: result.path
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSubmit = async () => {
    if (!profile?.id) return;

    // Validation
    if (formData.specializations.length === 0) {
      setError('Please select at least one specialization');
      return;
    }

    if (!formData.terms_accepted) {
      setError('You must accept the terms and conditions');
      return;
    }

    const requiredDocs = [
      'professional_certificate_url',
      'academic_certificates_url',
      'practicing_certificate_url',
      'id_copy_url',
      'cv_url'
    ];

    for (const doc of requiredDocs) {
      if (!formData[doc as keyof SubmitApplicationData]) {
        setError('Please upload all required documents');
        return;
      }
    }

    setError(null);
    const result = await submitApplication(profile.id, formData);

    if (result.success && result.applicationNumber) {
      onSuccess(result.applicationNumber);
    } else {
      setError(result.error || 'Failed to submit application');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-red-600" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.id_number}
                  onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Award className="h-5 w-5 mr-2 text-red-600" />
              Professional Qualifications
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qualification <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value as AuditorQualification })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="CERTIFIED_PUBLIC_ACCOUNTANT">Certified Public Accountant (CPA)</option>
                  <option value="CHARTERED_ACCOUNTANT">Chartered Accountant (CA)</option>
                  <option value="COOPERATIVE_AUDITOR">Cooperative Auditor</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certification Body <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.certification_body}
                  onChange={(e) => setFormData({ ...formData, certification_body: e.target.value })}
                  placeholder="e.g., ICPAK, ICAEW"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certificate Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.certificate_number}
                  onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certificate Issue Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.certificate_issue_date}
                  onChange={(e) => setFormData({ ...formData, certificate_issue_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.years_experience}
                  onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialization Areas <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {specializations.map((spec) => (
                  <label key={spec} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.specializations.includes(spec)}
                      onChange={() => handleSpecializationToggle(spec)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">{spec.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-red-600" />
              Document Uploads
            </h3>

            {[
              { key: 'professional_certificate', label: 'Professional Certificate' },
              { key: 'academic_certificates', label: 'Academic Certificates' },
              { key: 'practicing_certificate', label: 'Valid Practicing Certificate' },
              { key: 'id_copy', label: 'ID Copy' },
              { key: 'cv', label: 'CV/Resume' }
            ].map((doc) => (
              <div key={doc.key} className="border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {doc.label} <span className="text-red-500">*</span>
                </label>
                
                {formData[`${doc.key}_url` as keyof SubmitApplicationData] ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-800">Uploaded</span>
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, [`${doc.key}_url`]: '' })}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      id={doc.key}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, doc.key);
                      }}
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      className="hidden"
                      disabled={uploadingDoc === doc.key}
                    />
                    <label
                      htmlFor={doc.key}
                      className="flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <Upload className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {uploadingDoc === doc.key ? 'Uploading...' : 'Click to upload'}
                      </span>
                    </label>
                  </div>
                )}
              </div>
            ))}

            <p className="text-xs text-gray-500">
              Accepted formats: PDF, PNG, JPG, JPEG, DOC, DOCX • Maximum size: 5MB
            </p>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Terms and Conditions</h3>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="prose prose-sm">
                <h4 className="font-semibold text-gray-900">Auditor Certification Terms</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>I certify that all information provided is accurate and truthful</li>
                  <li>I hold valid professional certification from a recognized body</li>
                  <li>I agree to maintain professional standards and ethics</li>
                  <li>I will comply with all regulatory requirements</li>
                  <li>I understand that providing false information may result in rejection or revocation</li>
                  <li>I consent to verification of my credentials</li>
                  <li>I will notify the department of any changes to my certification status</li>
                </ul>
              </div>
            </div>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.terms_accepted}
                onChange={(e) => setFormData({ ...formData, terms_accepted: e.target.checked })}
                className="mt-1 rounded border-gray-300 text-red-600 focus:ring-red-500"
                required
              />
              <span className="text-sm text-gray-700">
                I have read and agree to the terms and conditions <span className="text-red-500">*</span>
              </span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Apply as Auditor</h2>
            <p className="text-sm text-gray-600 mt-1">Step {currentStep} of 4</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {renderStepContent()}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-2 w-8 rounded-full transition-colors ${
                  step === currentStep ? 'bg-red-600' : step < currentStep ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || uploading}
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
