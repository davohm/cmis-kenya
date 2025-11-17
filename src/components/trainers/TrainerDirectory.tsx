import { useState } from 'react';
import { Search, Award, GraduationCap, Star, Phone, Mail, Globe, BookOpen } from 'lucide-react';
import { 
  useTrainerDirectory, 
  TrainerProfile,
  EducationLevel,
  TrainerSpecialization,
  InstructionLanguage
} from '../../hooks/useTrainerRegistration';

interface TrainerDirectoryProps {
  onSelectTrainer?: (trainer: TrainerProfile) => void;
}

export default function TrainerDirectory({ onSelectTrainer }: TrainerDirectoryProps) {
  const [educationFilter, setEducationFilter] = useState<EducationLevel | 'ALL'>('ALL');
  const [specializationFilter, setSpecializationFilter] = useState<TrainerSpecialization | 'ALL'>('ALL');
  const [languageFilter, setLanguageFilter] = useState<InstructionLanguage | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerProfile | null>(null);
  const [page] = useState(1);

  const { trainers, loading, error, totalCount } = useTrainerDirectory(
    {
      education_level: educationFilter,
      specialization: specializationFilter,
      language: languageFilter,
      search: searchQuery
    },
    page,
    12
  );

  const getEducationLabel = (education: EducationLevel) => {
    return education.charAt(0) + education.slice(1).toLowerCase();
  };

  const handleTrainerClick = (trainer: TrainerProfile) => {
    setSelectedTrainer(trainer);
    if (onSelectTrainer) {
      onSelectTrainer(trainer);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (selectedTrainer) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedTrainer(null)}
          className="text-red-600 hover:text-red-700 font-semibold"
        >
          ← Back to Directory
        </button>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-8">
            <div className="flex items-start space-x-6">
              <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center">
                {selectedTrainer.photo_url ? (
                  <img
                    src={selectedTrainer.photo_url}
                    alt={selectedTrainer.full_name}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <GraduationCap className="h-12 w-12 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{selectedTrainer.full_name}</h2>
                <p className="text-red-100 mt-1">
                  {getEducationLabel(selectedTrainer.education_level)} • {selectedTrainer.institution}
                </p>
                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex items-center text-white">
                    <Star className="h-4 w-4 mr-1 fill-current" />
                    <span>{selectedTrainer.average_rating.toFixed(1)} Rating</span>
                  </div>
                  <div className="flex items-center text-white">
                    <BookOpen className="h-4 w-4 mr-1" />
                    <span>{selectedTrainer.total_programs_delivered} Programs</span>
                  </div>
                  <div className="flex items-center text-white">
                    <Award className="h-4 w-4 mr-1" />
                    <span>{selectedTrainer.years_experience} Years Experience</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{selectedTrainer.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">{selectedTrainer.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Training Specializations</h3>
              <div className="flex flex-wrap gap-2">
                {selectedTrainer.specializations.map((spec) => (
                  <span key={spec} className="px-3 py-2 bg-red-50 text-red-700 rounded-lg font-medium">
                    {spec.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Languages of Instruction</h3>
              <div className="flex flex-wrap gap-2">
                {selectedTrainer.languages.map((lang) => (
                  <span key={lang} className="px-3 py-2 bg-green-50 text-green-700 rounded-lg font-medium flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>{lang}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <BookOpen className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{selectedTrainer.total_programs_delivered}</p>
                <p className="text-sm text-gray-600">Programs Delivered</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{selectedTrainer.total_participants_trained}</p>
                <p className="text-sm text-gray-600">Participants Trained</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{selectedTrainer.average_rating.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Average Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Trainer Directory</h3>
        <p className="text-sm text-gray-600 mt-2 md:mt-0">{totalCount} approved trainers</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or institution..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        <select
          value={educationFilter}
          onChange={(e) => setEducationFilter(e.target.value as EducationLevel | 'ALL')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="ALL">All Education</option>
          <option value="DIPLOMA">Diploma</option>
          <option value="DEGREE">Degree</option>
          <option value="MASTERS">Masters</option>
          <option value="PHD">PhD</option>
        </select>
        <select
          value={specializationFilter}
          onChange={(e) => setSpecializationFilter(e.target.value as TrainerSpecialization | 'ALL')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="ALL">All Specializations</option>
          <option value="GOVERNANCE">Governance</option>
          <option value="FINANCIAL_MANAGEMENT">Financial Management</option>
          <option value="BOOKKEEPING">Bookkeeping</option>
          <option value="LEADERSHIP">Leadership</option>
          <option value="COMPLIANCE">Compliance</option>
          <option value="DIGITAL_LITERACY">Digital Literacy</option>
          <option value="ENTREPRENEURSHIP">Entrepreneurship</option>
          <option value="OTHER">Other</option>
        </select>
        <select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value as InstructionLanguage | 'ALL')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="ALL">All Languages</option>
          <option value="ENGLISH">English</option>
          <option value="SWAHILI">Swahili</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {trainers.length === 0 ? (
        <div className="text-center py-12">
          <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No trainers found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainers.map((trainer) => (
            <div
              key={trainer.id}
              onClick={() => handleTrainerClick(trainer)}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-red-300 transition-all cursor-pointer"
            >
              <div className="flex items-start space-x-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  {trainer.photo_url ? (
                    <img
                      src={trainer.photo_url}
                      alt={trainer.full_name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <GraduationCap className="h-8 w-8 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">{trainer.full_name}</h4>
                  <p className="text-sm text-gray-600 truncate">{trainer.institution}</p>
                  <div className="flex items-center mt-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm text-gray-700 ml-1">{trainer.average_rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Award className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{getEducationLabel(trainer.education_level)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{trainer.years_experience} years experience</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Globe className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{trainer.languages.join(', ')}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-1">
                  {trainer.specializations.slice(0, 2).map((spec) => (
                    <span key={spec} className="inline-block px-2 py-1 bg-red-50 text-red-700 text-xs rounded font-medium">
                      {spec.replace(/_/g, ' ').substring(0, 12)}
                    </span>
                  ))}
                  {trainer.specializations.length > 2 && (
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium">
                      +{trainer.specializations.length - 2}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
                <span>{trainer.total_programs_delivered} programs</span>
                <span>{trainer.total_participants_trained} trained</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalCount > 12 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Showing {trainers.length} of {totalCount} trainers
          </p>
        </div>
      )}
    </div>
  );
}
