import { useState, useEffect } from 'react';
import { GraduationCap, Clock, CheckCircle, Award, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import TrainerApplicationsList from '../trainers/TrainerApplicationsList';
import TrainerApplicationDetail from '../trainers/TrainerApplicationDetail';
import TrainerDirectory from '../trainers/TrainerDirectory';
import ApplyAsTrainerModal from '../trainers/ApplyAsTrainerModal';
import { TrainerApplication } from '../../hooks/useTrainerRegistration';

interface TrainersTabProps {
  role: string;
}

export default function TrainersTab({ role }: TrainersTabProps) {
  const { } = useAuth();
  const [activeView, setActiveView] = useState<'applications' | 'directory'>('directory');
  const [selectedApplication, setSelectedApplication] = useState<TrainerApplication | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [stats, setStats] = useState({
    totalTrainers: 0,
    pendingApplications: 0,
    approvedTrainers: 0,
    activeTrainers: 0
  });
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isAdmin = role === 'SUPER_ADMIN' || role === 'COUNTY_ADMIN';
  const isTrainer = role === 'TRAINER';

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      const { count: totalApplications } = await supabase
        .from('trainer_applications')
        .select('*', { count: 'exact' });

      const { count: pending } = await supabase
        .from('trainer_applications')
        .select('*', { count: 'exact' })
        .in('status', ['PENDING', 'UNDER_REVIEW']);

      const { count: approved } = await supabase
        .from('trainer_applications')
        .select('*', { count: 'exact' })
        .eq('status', 'APPROVED');

      const { count: active } = await supabase
        .from('trainer_profiles')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      setStats({
        totalTrainers: totalApplications || 0,
        pendingApplications: pending || 0,
        approvedTrainers: approved || 0,
        activeTrainers: active || 0
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationSelect = (application: TrainerApplication) => {
    setSelectedApplication(application);
  };

  const handleBack = () => {
    setSelectedApplication(null);
    loadStats();
  };

  const handleApplySuccess = (applicationNumber: string) => {
    setShowApplyModal(false);
    setSuccessMessage(`Application ${applicationNumber} submitted successfully!`);
    setTimeout(() => setSuccessMessage(null), 5000);
    loadStats();
  };

  if (selectedApplication) {
    return (
      <TrainerApplicationDetail
        application={selectedApplication}
        onBack={handleBack}
        onUpdate={loadStats}
        role={role}
      />
    );
  }

  const statCards = [
    {
      label: 'Total Applications',
      value: stats.totalTrainers,
      icon: GraduationCap,
      color: 'bg-red-600',
      visible: isAdmin
    },
    {
      label: 'Pending Review',
      value: stats.pendingApplications,
      icon: Clock,
      color: 'bg-yellow-600',
      visible: isAdmin
    },
    {
      label: 'Approved Trainers',
      value: stats.approvedTrainers,
      icon: CheckCircle,
      color: 'bg-green-600',
      visible: true
    },
    {
      label: 'Active Trainers',
      value: stats.activeTrainers,
      icon: Award,
      color: 'bg-green-700',
      visible: true
    }
  ];

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-500 rounded-lg p-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Trainers</h2>
            <p className="text-gray-600 mt-1">
              {isAdmin 
                ? 'Manage trainer applications and certifications' 
                : 'Browse approved trainers for cooperative training programs'}
            </p>
          </div>
          {!isAdmin && !isTrainer && (
            <button
              onClick={() => setShowApplyModal(true)}
              className="mt-4 md:mt-0 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Apply as Trainer</span>
            </button>
          )}
        </div>

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.filter(card => card.visible).map((card, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className={`${card.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                  <card.icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-600 mt-1">{card.label}</p>
              </div>
            ))}
          </div>
        )}

        {isAdmin && (
          <div className="flex space-x-2 border-b border-gray-200">
            <button
              onClick={() => setActiveView('applications')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeView === 'applications'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Applications
            </button>
            <button
              onClick={() => setActiveView('directory')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeView === 'directory'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Directory
            </button>
          </div>
        )}
      </div>

      {activeView === 'applications' && isAdmin ? (
        <TrainerApplicationsList
          role={role}
          onSelectApplication={handleApplicationSelect}
        />
      ) : (
        <TrainerDirectory />
      )}

      {showApplyModal && (
        <ApplyAsTrainerModal
          onClose={() => setShowApplyModal(false)}
          onSuccess={handleApplySuccess}
        />
      )}
    </div>
  );
}
