import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, FileText, Upload, X, Download, Loader, Shield } from 'lucide-react';
import { useRegistrationDraft, RegistrationFormData } from '../../hooks/useRegistrationDraft';
import { supabase } from '../../lib/supabase';
import DocumentUploader from './DocumentUploader';
import { useDocumentUpload } from '../../hooks/useDocumentUpload';
import IDVerificationModal from '../integrations/IDVerificationModal';
import { IPRSRecord } from '../../services/mockIntegrations';

interface RegistrationWizardProps {
  onClose: () => void;
  onSuccess: (applicationNumber: string) => void;
}

interface CooperativeType {
  id: string;
  name: string;
  category: string;
}

interface DocumentLinkProps {
  path: string | undefined;
  label: string;
}

function DocumentLink({ path, label }: DocumentLinkProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { getSignedUrl } = useDocumentUpload();

  useEffect(() => {
    if (path) {
      setLoading(true);
      getSignedUrl(path).then(url => {
        setSignedUrl(url);
        setLoading(false);
      });
    }
  }, [path]);

  if (!path) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <span className="text-sm text-yellow-800">{label} - Not uploaded</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <FileText className="h-5 w-5 text-red-600" />
          <span className="text-sm font-medium text-gray-900">{label}</span>
        </div>
        <Loader className="h-4 w-4 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
        <span className="text-sm text-red-800">{label} - Error loading document</span>
      </div>
    );
  }

  return (
    <a
      href={signedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      <div className="flex items-center space-x-3">
        <FileText className="h-5 w-5 text-red-600" />
        <span className="text-sm font-medium text-gray-900">{label}</span>
      </div>
      <Download className="h-4 w-4 text-gray-400 group-hover:text-red-600" />
    </a>
  );
}

export default function RegistrationWizard({ onClose, onSuccess }: RegistrationWizardProps) {
  const { draft, loading, saving, saveDraft, submitApplication } = useRegistrationDraft();
  const [currentStep, setCurrentStep] = useState(1);
  const [cooperativeTypes, setCooperativeTypes] = useState<CooperativeType[]>([]);
  const [formData, setFormData] = useState<RegistrationFormData>({
    proposed_name: '',
    type_id: '',
    proposed_members: 0,
    proposed_share_capital: 0,
    primary_activity: '',
    operating_area: '',
    address: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    bylaws_url: undefined,
    member_list_url: undefined,
    minutes_url: undefined,
    id_copies_url: undefined,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationFormData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const [nameAvailability, setNameAvailability] = useState<'available' | 'taken' | null>(null);
  const [showIDVerification, setShowIDVerification] = useState(false);
  const [verifiedID, setVerifiedID] = useState<IPRSRecord | null>(null);

  useEffect(() => {
    loadCooperativeTypes();
  }, []);

  useEffect(() => {
    if (draft?.formData) {
      setFormData(draft.formData);
    }
  }, [draft]);

  const checkNameAvailability = async () => {
    if (!formData.proposed_name.trim()) {
      setErrors({ ...errors, proposed_name: 'Please enter a cooperative name' });
      return;
    }

    setCheckingName(true);
    setNameAvailability(null);

    try {
      // Check in cooperatives table
      const { data: existingCoop } = await supabase
        .from('cooperatives')
        .select('id')
        .ilike('name', formData.proposed_name)
        .single();

      // Check in applications table
      const { data: existingApp } = await supabase
        .from('registration_applications')
        .select('id')
        .ilike('proposed_name', formData.proposed_name)
        .in('status', ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'])
        .single();

      if (existingCoop || existingApp) {
        setNameAvailability('taken');
        setErrors({ ...errors, proposed_name: 'This name is already taken or pending approval' });
      } else {
        setNameAvailability('available');
        const newErrors = { ...errors };
        delete newErrors.proposed_name;
        setErrors(newErrors);
      }
    } catch (error) {
      console.error('Error checking name availability:', error);
    } finally {
      setCheckingName(false);
    }
  };

  const loadCooperativeTypes = async () => {
    const { data, error } = await supabase
      .from('cooperative_types')
      .select('id, name, category')
      .order('name');

    if (error) {
      console.error('Error loading cooperative types:', error);
    } else {
      setCooperativeTypes(data || []);
    }
  };

  const updateField = (field: keyof RegistrationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof RegistrationFormData, string>> = {};

    if (step === 1) {
      if (!formData.proposed_name.trim()) {
        newErrors.proposed_name = 'Proposed name is required';
      }
      if (!formData.type_id) {
        newErrors.type_id = 'Cooperative type is required';
      }
      if (!formData.proposed_members || formData.proposed_members < 1) {
        newErrors.proposed_members = 'At least 1 member is required';
      }
      if (!formData.primary_activity?.trim()) {
        newErrors.primary_activity = 'Primary activity is required';
      }
      if (!formData.operating_area?.trim()) {
        newErrors.operating_area = 'Operating area is required';
      }
    }

    if (step === 2) {
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
      }
      if (!formData.contact_person.trim()) {
        newErrors.contact_person = 'Contact person is required';
      }
      if (!formData.contact_phone.trim()) {
        newErrors.contact_phone = 'Contact phone is required';
      }
      if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
        newErrors.contact_email = 'Invalid email format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      try {
        await saveDraft(formData, currentStep + 1);
        setCurrentStep(currentStep + 1);
      } catch (error) {
        console.error('Error saving draft:', error);
      }
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleIDVerified = (record: IPRSRecord) => {
    setVerifiedID(record);
    updateField('contact_person', record.full_name);
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    // Validate all required documents are uploaded
    const missingDocuments = [];
    if (!formData.bylaws_url) missingDocuments.push('Proposed Bylaws');
    if (!formData.member_list_url) missingDocuments.push('List of Proposed Members');
    if (!formData.minutes_url) missingDocuments.push('Minutes of Formation Meeting');
    if (!formData.id_copies_url) missingDocuments.push('ID Copies of Officials');

    if (missingDocuments.length > 0) {
      setSubmitError(
        `Please upload all required documents before submitting. Missing: ${missingDocuments.join(', ')}`
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitApplication(formData);
      onSuccess(result.application_number);
    } catch (error) {
      console.error('Error submitting application:', error);
      setSubmitError('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Basic Information', icon: FileText },
    { number: 2, title: 'Contact & Address', icon: FileText },
    { number: 3, title: 'Documents', icon: Upload },
    { number: 4, title: 'Review & Submit', icon: Check },
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-red-600 to-green-700 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Register New Cooperative</h2>
            {draft?.application_number && (
              <p className="text-sm text-white/90 mt-1">Application: {draft.application_number}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep >= step.number
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <p className={`text-xs mt-2 text-center ${
                    currentStep >= step.number ? 'text-red-600 font-semibold' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step.number ? 'bg-red-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proposed Cooperative Name *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.proposed_name}
                    onChange={(e) => {
                      updateField('proposed_name', e.target.value);
                      setNameAvailability(null);
                    }}
                    className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.proposed_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter cooperative name"
                  />
                  <button
                    type="button"
                    onClick={checkNameAvailability}
                    disabled={checkingName || !formData.proposed_name.trim()}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkingName ? 'Checking...' : 'Check Availability'}
                  </button>
                </div>
                {nameAvailability === 'available' && (
                  <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                    <Check className="h-4 w-4" /> Name is available
                  </p>
                )}
                {nameAvailability === 'taken' && (
                  <p className="text-red-500 text-sm mt-1">This name is already taken or pending approval</p>
                )}
                {errors.proposed_name && nameAvailability !== 'taken' && (
                  <p className="text-red-500 text-sm mt-1">{errors.proposed_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cooperative Type *
                </label>
                <select
                  value={formData.type_id}
                  onChange={(e) => updateField('type_id', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.type_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select cooperative type</option>
                  {cooperativeTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.category})
                    </option>
                  ))}
                </select>
                {errors.type_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.type_id}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proposed Number of Members *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.proposed_members || ''}
                    onChange={(e) => updateField('proposed_members', parseInt(e.target.value) || 0)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.proposed_members ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 50"
                  />
                  {errors.proposed_members && (
                    <p className="text-red-500 text-sm mt-1">{errors.proposed_members}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proposed Share Capital (KES)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.proposed_share_capital || ''}
                    onChange={(e) => updateField('proposed_share_capital', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., 1000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Activity *
                </label>
                <textarea
                  value={formData.primary_activity}
                  onChange={(e) => updateField('primary_activity', e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.primary_activity ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe the main business activity"
                />
                {errors.primary_activity && (
                  <p className="text-red-500 text-sm mt-1">{errors.primary_activity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operating Area *
                </label>
                <input
                  type="text"
                  value={formData.operating_area}
                  onChange={(e) => updateField('operating_area', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.operating_area ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Nairobi County, National, etc."
                />
                {errors.operating_area && (
                  <p className="text-red-500 text-sm mt-1">{errors.operating_area}</p>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Contact & Address Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Physical Address *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter full physical address"
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person * {verifiedID && <span className="text-green-600 text-xs">(ID Verified ✓)</span>}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => updateField('contact_person', e.target.value)}
                    className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.contact_person ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Full name of contact person"
                  />
                  <button
                    type="button"
                    onClick={() => setShowIDVerification(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Verify ID</span>
                  </button>
                </div>
                {verifiedID && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    Verified: {verifiedID.full_name} (ID: {verifiedID.id_number})
                  </div>
                )}
                {errors.contact_person && (
                  <p className="text-red-500 text-sm mt-1">{errors.contact_person}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => updateField('contact_phone', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.contact_phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., +254712345678"
                  />
                  {errors.contact_phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.contact_phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => updateField('contact_email', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.contact_email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="email@example.com"
                  />
                  {errors.contact_email && (
                    <p className="text-red-500 text-sm mt-1">{errors.contact_email}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Required Documents</h3>
              
              <p className="text-sm text-gray-600 mb-4">
                Please upload the following documents. All documents must be in PDF, PNG, JPG, JPEG, DOC, or DOCX format and not exceed 5MB.
              </p>

              {!draft?.id ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Please complete the previous steps before uploading documents. Documents will be available after saving your draft.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <DocumentUploader
                    label="Proposed Bylaws"
                    documentType="bylaws"
                    applicationId={draft.id}
                    currentUrl={formData.bylaws_url}
                    onUploadComplete={(_url, path) => {
                      updateField('bylaws_url', path);
                      saveDraft({ ...formData, bylaws_url: path }, currentStep);
                    }}
                    onRemove={() => {
                      updateField('bylaws_url', undefined);
                      saveDraft({ ...formData, bylaws_url: undefined }, currentStep);
                    }}
                    required
                  />

                  <DocumentUploader
                    label="List of Proposed Members"
                    documentType="member_list"
                    applicationId={draft.id}
                    currentUrl={formData.member_list_url}
                    onUploadComplete={(_url, path) => {
                      updateField('member_list_url', path);
                      saveDraft({ ...formData, member_list_url: path }, currentStep);
                    }}
                    onRemove={() => {
                      updateField('member_list_url', undefined);
                      saveDraft({ ...formData, member_list_url: undefined }, currentStep);
                    }}
                    required
                  />

                  <DocumentUploader
                    label="Minutes of Formation Meeting"
                    documentType="minutes"
                    applicationId={draft.id}
                    currentUrl={formData.minutes_url}
                    onUploadComplete={(_url, path) => {
                      updateField('minutes_url', path);
                      saveDraft({ ...formData, minutes_url: path }, currentStep);
                    }}
                    onRemove={() => {
                      updateField('minutes_url', undefined);
                      saveDraft({ ...formData, minutes_url: undefined }, currentStep);
                    }}
                    required
                  />

                  <DocumentUploader
                    label="ID Copies of Officials"
                    documentType="id_copies"
                    applicationId={draft.id}
                    currentUrl={formData.id_copies_url}
                    onUploadComplete={(_url, path) => {
                      updateField('id_copies_url', path);
                      saveDraft({ ...formData, id_copies_url: path }, currentStep);
                    }}
                    onRemove={() => {
                      updateField('id_copies_url', undefined);
                      saveDraft({ ...formData, id_copies_url: undefined }, currentStep);
                    }}
                    required
                  />
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Review & Submit</h3>
              
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-gray-600">Proposed Name:</dt>
                      <dd className="font-medium text-gray-900">{formData.proposed_name}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">Cooperative Type:</dt>
                      <dd className="font-medium text-gray-900">
                        {cooperativeTypes.find(t => t.id === formData.type_id)?.name || 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">Proposed Members:</dt>
                      <dd className="font-medium text-gray-900">{formData.proposed_members}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">Share Capital:</dt>
                      <dd className="font-medium text-gray-900">
                        KES {formData.proposed_share_capital?.toLocaleString() || '0'}
                      </dd>
                    </div>
                    <div className="md:col-span-2">
                      <dt className="text-gray-600">Primary Activity:</dt>
                      <dd className="font-medium text-gray-900">{formData.primary_activity}</dd>
                    </div>
                    <div className="md:col-span-2">
                      <dt className="text-gray-600">Operating Area:</dt>
                      <dd className="font-medium text-gray-900">{formData.operating_area}</dd>
                    </div>
                  </dl>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="md:col-span-2">
                      <dt className="text-gray-600">Address:</dt>
                      <dd className="font-medium text-gray-900">{formData.address}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">Contact Person:</dt>
                      <dd className="font-medium text-gray-900">{formData.contact_person}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">Phone:</dt>
                      <dd className="font-medium text-gray-900">{formData.contact_phone}</dd>
                    </div>
                    {formData.contact_email && (
                      <div className="md:col-span-2">
                        <dt className="text-gray-600">Email:</dt>
                        <dd className="font-medium text-gray-900">{formData.contact_email}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Uploaded Documents</h4>
                  <div className="space-y-2">
                    <DocumentLink path={formData.bylaws_url} label="Proposed Bylaws" />
                    <DocumentLink path={formData.member_list_url} label="List of Proposed Members" />
                    <DocumentLink path={formData.minutes_url} label="Minutes of Formation Meeting" />
                    <DocumentLink path={formData.id_copies_url} label="ID Copies of Officials" />
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{submitError}</p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> By submitting this application, you confirm that all information provided is accurate and complete.
                  Your application will be reviewed by the county cooperative officer.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t bg-gray-50 px-6 py-4 flex justify-between items-center">
          <div>
            {saving && (
              <p className="text-sm text-gray-600">Saving draft...</p>
            )}
          </div>
          <div className="flex space-x-3">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                disabled={saving}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </button>
            )}
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={saving}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center font-semibold"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
                <Check className="h-5 w-5 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showIDVerification && (
        <IDVerificationModal
          onClose={() => setShowIDVerification(false)}
          onVerified={handleIDVerified}
        />
      )}
    </div>
  );
}
