import { useState, useEffect } from 'react';
import { Shield, Users, Clock, CheckCircle, Award, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import AuditorApplicationsList from '../auditors/AuditorApplicationsList';
import AuditorApplicationDetail from '../auditors/AuditorApplicationDetail';
import AuditorDirectory from '../auditors/AuditorDirectory';
import ApplyAsAuditorModal from '../auditors/ApplyAsAuditorModal';
import { AuditorApplication } from '../../hooks/useAuditorRegistration';

interface AuditorsTabProps {
  role: string;
}

export default function AuditorsTab({ role }: AuditorsTabProps) {
  const { profile } = useAuth();
  const [activeView, setActiveView] = useState<'applications' | 'directory'>('directory');
  const [selectedApplication, setSelectedApplication] = useState<AuditorApplication | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [stats, setStats] = useState({
    totalAuditors: 0,
    pendingApplications: 0,
    approvedAuditors: 0,
    activeAuditors: 0
  });
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isAdmin = role === 'SUPER_ADMIN' || role === 'COUNTY_ADMIN';
  const isAuditor = role === 'AUDITOR';

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      const { count: totalApplications } = await supabase
        .from('auditor_applications')
        .select('*', { count: 'exact' });

      const { count: pending } = await supabase
        .from('auditor_applications')
        .select('*', { count: 'exact' })
        .in('status', ['PENDING', 'UNDER_REVIEW']);

      const { count: approved } = await supabase
        .from('auditor_applications')
        .select('*', { count: 'exact' })
        .eq('status', 'APPROVED');

      const { count: active } = await supabase
        .from('auditor_profiles')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      setStats({
        totalAuditors: totalApplications || 0,
        pendingApplications: pending || 0,
        approvedAuditors: approved || 0,
        activeAuditors: active || 0
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationSelect = (application: AuditorApplication) => {
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
      <AuditorApplicationDetail
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
      value: stats.totalAuditors,
      icon: Shield,
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
      label: 'Approved Auditors',
      value: stats.approvedAuditors,
      icon: CheckCircle,
      color: 'bg-green-600',
      visible: true
    },
    {
      label: 'Active Auditors',
      value: stats.activeAuditors,
      icon: Award,
      color: 'bg-blue-600',
      visible: true
    }
  ];

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Auditor Registration</h2>
          <p className="text-gray-600 mt-1">
            {isAdmin
              ? 'Manage auditor applications and certifications'
              : 'Find certified cooperative auditors'}
          </p>
        </div>

        {!isAdmin && !isAuditor && (
          <button
            onClick={() => setShowApplyModal(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Apply as Auditor
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards
          .filter((stat) => stat.visible)
          .map((stat, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {loading ? '...' : stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
      </div>

      {isAdmin && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveView('applications')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeView === 'applications'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Shield className="h-5 w-5 inline mr-2" />
                Applications
              </button>
              <button
                onClick={() => setActiveView('directory')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeView === 'directory'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-5 w-5 inline mr-2" />
                Directory
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeView === 'applications' ? (
              <AuditorApplicationsList
                role={role}
                userId={profile?.id}
                onSelectApplication={handleApplicationSelect}
              />
            ) : (
              <AuditorDirectory />
            )}
          </div>
        </div>
      )}

      {!isAdmin && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Certified Auditors Directory</h3>
            </div>
          </div>
          <AuditorDirectory />
        </div>
      )}

      {isAuditor && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Auditor Application</h3>
              <p className="text-sm text-blue-800 mb-4">
                View your application status and manage your auditor profile here.
              </p>
              <button
                onClick={() => setActiveView('applications')}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                View My Application
              </button>
            </div>
          </div>
        </div>
      )}

      {showApplyModal && (
        <ApplyAsAuditorModal
          onClose={() => setShowApplyModal(false)}
          onSuccess={handleApplySuccess}
        />
      )}
    </div>
  );
}
