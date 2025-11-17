import { useState } from 'react';
import { X, FileText, GraduationCap, Award, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  useTrainerActions, 
  EducationLevel, 
  TrainerSpecialization,
  InstructionLanguage,
  SubmitApplicationData 
} from '../../hooks/useTrainerRegistration';
import { useDocumentUpload } from '../../hooks/useDocumentUpload';

interface ApplyAsTrainerModalProps {
  onClose: () => void;
  onSuccess: (applicationNumber: string) => void;
}

export default function ApplyAsTrainerModal({ onClose, onSuccess }: ApplyAsTrainerModalProps) {
  const { profile } = useAuth();
  const { submitApplication, submitting } = useTrainerActions();
  const { uploadDocument, uploading, validateFile } = useDocumentUpload();

  const [formData, setFormData] = useState<SubmitApplicationData>({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    id_number: '',
    education_level: 'DEGREE',
    institution: '',
    years_experience: 0,
    specializations: [],
    languages: [],
    academic_certificates_url: '',
    training_certificates_url: '',
    sample_materials_url: '',
    id_copy_url: '',
    cv_url: '',
    terms_accepted: false,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const specializations: TrainerSpecialization[] = [
    'GOVERNANCE', 'FINANCIAL_MANAGEMENT', 'BOOKKEEPING', 'LEADERSHIP', 
    'COMPLIANCE', 'DIGITAL_LITERACY', 'ENTREPRENEURSHIP', 'OTHER'
  ];

  const languages: InstructionLanguage[] = ['ENGLISH', 'SWAHILI', 'OTHER'];

  const handleSpecializationToggle = (spec: TrainerSpecialization) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  const handleLanguageToggle = (lang: InstructionLanguage) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
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

    if (formData.specializations.length === 0) {
      setError('Please select at least one training specialization');
      return;
    }

    if (formData.languages.length === 0) {
      setError('Please select at least one language of instruction');
      return;
    }

    if (!formData.terms_accepted) {
      setError('You must accept the terms and conditions');
      return;
    }

    const requiredDocs = [
      'academic_certificates_url',
      'training_certificates_url',
      'sample_materials_url',
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

  const getSpecializationLabel = (spec: TrainerSpecialization) => {
    return spec.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-6 w-6 text-white" />
            <h2 className="text-xl font-bold text-white">Apply as Trainer</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      currentStep > step ? 'bg-red-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm">
              <span className={currentStep >= 1 ? 'text-red-600 font-semibold' : 'text-gray-500'}>Personal Info</span>
              <span className={currentStep >= 2 ? 'text-red-600 font-semibold' : 'text-gray-500'}>Qualifications</span>
              <span className={currentStep >= 3 ? 'text-red-600 font-semibold' : 'text-gray-500'}>Documents</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ID Number *
                  </label>
                  <input
                    type="text"
                    value={formData.id_number}
                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="National ID or Passport Number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Education Level *
                  </label>
                  <select
                    value={formData.education_level}
                    onChange={(e) => setFormData({ ...formData, education_level: e.target.value as EducationLevel })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  >
                    <option value="DIPLOMA">Diploma</option>
                    <option value="DEGREE">Degree</option>
                    <option value="MASTERS">Masters</option>
                    <option value="PHD">PhD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Institution *
                  </label>
                  <input
                    type="text"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Educational Institution"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Years of Training Experience *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.years_experience}
                    onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Training Specializations * (Select at least one)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {specializations.map((spec) => (
                    <label key={spec} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.specializations.includes(spec)}
                        onChange={() => handleSpecializationToggle(spec)}
                        className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{getSpecializationLabel(spec)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Languages of Instruction * (Select at least one)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {languages.map((lang) => (
                    <label key={lang} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.languages.includes(lang)}
                        onChange={() => handleLanguageToggle(lang)}
                        className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{lang}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              {[
                { key: 'academic_certificates', label: 'Academic Certificates', icon: GraduationCap },
                { key: 'training_certificates', label: 'Training Certificates/Qualifications', icon: Award },
                { key: 'sample_materials', label: 'Sample Training Materials', icon: FileText },
                { key: 'id_copy', label: 'ID Copy', icon: FileText },
                { key: 'cv', label: 'CV/Resume', icon: FileText }
              ].map((doc) => (
                <div key={doc.key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <doc.icon className="h-5 w-5 text-red-600" />
                      <span className="font-semibold text-gray-900">{doc.label} *</span>
                    </div>
                    {formData[`${doc.key}_url` as keyof SubmitApplicationData] && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, doc.key);
                    }}
                    disabled={uploadingDoc === doc.key}
                    className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 disabled:opacity-50"
                  />
                  {uploadingDoc === doc.key && (
                    <p className="text-sm text-blue-600 mt-2">Uploading...</p>
                  )}
                </div>
              ))}

              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.terms_accepted}
                    onChange={(e) => setFormData({ ...formData, terms_accepted: e.target.checked })}
                    className="mt-1 w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      I confirm that all information provided is accurate and I have uploaded authentic documents. 
                      I understand that providing false information may result in rejection or revocation of my trainer certification.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex items-center justify-between border-t border-gray-200">
          <div className="flex space-x-3">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || uploading}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
