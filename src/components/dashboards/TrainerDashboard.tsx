import { BookOpen, Users, Award, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';
import OfficialSearchesTab from '../tabs/OfficialSearchesTab';

interface TrainerDashboardProps {
  activeTab: string;
}

interface TrainingProgram {
  id: string;
  program_code: string;
  title: string;
  description: string;
  venue: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  status: string;
  participant_count?: number;
  certificates_issued?: number;
}

export default function TrainerDashboard({ activeTab }: TrainerDashboardProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPrograms: 0,
    activeParticipants: 0,
    certificatesIssued: 0,
    satisfactionRate: 0
  });
  const [upcomingPrograms, setUpcomingPrograms] = useState<TrainingProgram[]>([]);
  const [completedPrograms, setCompletedPrograms] = useState<TrainingProgram[]>([]);
  const [thisMonthPrograms, setThisMonthPrograms] = useState(0);
  const [enrolledParticipants, setEnrolledParticipants] = useState(0);
  const [pendingCertificates, setPendingCertificates] = useState(0);

  useEffect(() => {
    if (profile?.id) {
      fetchTrainerData();
    }
  }, [profile?.id]);

  const fetchTrainerData = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      const { data: programs, error: programsError } = await supabase
        .from('training_programs')
        .select('*')
        .eq('trainer_id', profile.id)
        .order('start_date', { ascending: false });

      if (programsError) throw programsError;

      const totalPrograms = programs?.length || 0;

      const programIds = programs?.map(p => p.id) || [];
      
      let totalParticipants = 0;
      let totalCertificates = 0;
      let upcomingList: TrainingProgram[] = [];
      let completedList: TrainingProgram[] = [];
      let thisMonth = 0;
      let enrolled = 0;
      let pending = 0;

      if (programIds.length > 0) {
        const { data: registrations, error: regError } = await supabase
          .from('training_registrations')
          .select('program_id, certificate_issued, attended')
          .in('program_id', programIds);

        if (regError) throw regError;

        totalParticipants = registrations?.length || 0;
        totalCertificates = registrations?.filter(r => r.certificate_issued)?.length || 0;

        const registrationsByProgram = registrations?.reduce((acc, reg) => {
          if (!acc[reg.program_id]) acc[reg.program_id] = { count: 0, certificates: 0, attended: 0 };
          acc[reg.program_id].count++;
          if (reg.certificate_issued) acc[reg.program_id].certificates++;
          if (reg.attended) acc[reg.program_id].attended++;
          return acc;
        }, {} as Record<string, { count: number; certificates: number; attended: number }>);

        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        programs?.forEach(program => {
          const programWithStats = {
            ...program,
            participant_count: registrationsByProgram?.[program.id]?.count || 0,
            certificates_issued: registrationsByProgram?.[program.id]?.certificates || 0
          };

          const programDate = new Date(program.start_date);
          if (programDate.getMonth() === currentMonth && programDate.getFullYear() === currentYear) {
            thisMonth++;
          }

          if (program.status === 'COMPLETED') {
            completedList.push(programWithStats);
          } else if (program.start_date >= today && (program.status === 'SCHEDULED' || program.status === 'ONGOING')) {
            upcomingList.push(programWithStats);
            enrolled += programWithStats.participant_count || 0;
          }

          if (program.status === 'COMPLETED' || program.status === 'ONGOING') {
            const attendedCount = registrationsByProgram?.[program.id]?.attended || 0;
            const certificatesCount = registrationsByProgram?.[program.id]?.certificates || 0;
            pending += attendedCount - certificatesCount;
          }
        });

        upcomingList.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
        completedList.sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
      }

      setStats({
        totalPrograms,
        activeParticipants: totalParticipants,
        certificatesIssued: totalCertificates,
        satisfactionRate: totalCertificates > 0 ? Math.round((totalCertificates / totalParticipants) * 100) : 0
      });

      setUpcomingPrograms(upcomingList.slice(0, 3));
      setCompletedPrograms(completedList.slice(0, 3));
      setThisMonthPrograms(thisMonth);
      setEnrolledParticipants(enrolled);
      setPendingCertificates(Math.max(0, pending));

    } catch (error) {
      console.error('Error fetching trainer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const startMonth = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endDate = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startMonth}-${endDate}`;
  };

  if (activeTab === 'searches') {
    return <OfficialSearchesTab role="TRAINER" />;
  }

  if (activeTab !== 'overview') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </h2>
        <p className="text-gray-600">Detailed {activeTab} management for trainers...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const statsData = [
    { label: 'Total Trainings', value: stats.totalPrograms.toString(), icon: BookOpen, color: 'bg-green-600', trend: 'All time' },
    { label: 'Active Participants', value: stats.activeParticipants.toLocaleString(), icon: Users, color: 'bg-red-600', trend: 'Across programs' },
    { label: 'Certificates Issued', value: stats.certificatesIssued.toLocaleString(), icon: Award, color: 'bg-gray-700', trend: 'Total issued' },
    { label: 'Completion Rate', value: `${stats.satisfactionRate}%`, icon: TrendingUp, color: 'bg-green-700', trend: 'Certificate rate' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Training Dashboard</h2>
            <p className="text-green-100 mb-3">{profile?.full_name}</p>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-semibold">
                Certified Trainer
              </span>
            </div>
          </div>
          <BookOpen className="h-16 w-16 text-white opacity-20" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm font-medium text-gray-700 mb-2">{stat.label}</p>
            <p className="text-xs text-gray-500">{stat.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">Upcoming Training Programs</h3>
            </div>
          </div>
          <div className="space-y-4">
            {upcomingPrograms.length > 0 ? (
              upcomingPrograms.map((training) => (
                <div key={training.id} className="p-4 border-l-4 border-green-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{training.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{formatDateRange(training.start_date, training.end_date)}</p>
                      <p className="text-sm text-gray-600">{training.venue}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm text-gray-700">
                      <span className="font-semibold">{training.participant_count || 0}</span> / {training.max_participants} participants
                    </span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${((training.participant_count || 0) / training.max_participants) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No upcoming training programs</p>
            )}
          </div>
          <button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            Create New Training Program
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recently Completed</h3>
            <button className="text-sm text-red-600 font-semibold hover:text-red-700">View All</button>
          </div>
          <div className="space-y-4">
            {completedPrograms.length > 0 ? (
              completedPrograms.map((completion) => (
                <div key={completion.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{completion.title}</p>
                      <p className="text-sm text-gray-600">{formatDate(completion.end_date)}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span className="font-bold text-gray-900">
                        {completion.participant_count ? Math.round((completion.certificates_issued || 0) / completion.participant_count * 10) / 10 : 0}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Participants</p>
                      <p className="font-semibold text-gray-900">{completion.participant_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Certificates</p>
                      <p className="font-semibold text-gray-900">{completion.certificates_issued || 0}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No completed training programs</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 text-white">
          <Calendar className="h-8 w-8 mb-3 opacity-80" />
          <p className="text-2xl font-bold mb-1">{thisMonthPrograms}</p>
          <p className="text-red-100 text-sm mb-4">Programs This Month</p>
          <button className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors text-sm">
            View Schedule
          </button>
        </div>

        <div className="bg-gradient-to-br from-green-700 to-green-800 rounded-xl p-6 text-white">
          <Users className="h-8 w-8 mb-3 opacity-80" />
          <p className="text-2xl font-bold mb-1">{enrolledParticipants}</p>
          <p className="text-green-100 text-sm mb-4">Enrolled Participants</p>
          <button className="bg-white text-green-700 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors text-sm">
            Manage
          </button>
        </div>

        <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-6 text-white">
          <CheckCircle className="h-8 w-8 mb-3 opacity-80" />
          <p className="text-2xl font-bold mb-1">{pendingCertificates}</p>
          <p className="text-gray-200 text-sm mb-4">Pending Certificates</p>
          <button className="bg-white text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm">
            Process
          </button>
        </div>
      </div>
    </div>
  );
}
