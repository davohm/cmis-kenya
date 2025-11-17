import { Search, Building2, FileText, BookOpen, HelpCircle, TrendingUp, Map, PlusCircle, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import RegistrationWizard from '../registration/RegistrationWizard';
import ComplaintsTab from '../tabs/ComplaintsTab';
import AuditorsTab from '../tabs/AuditorsTab';
import TrainersTab from '../tabs/TrainersTab';
import OfficialSearchesTab from '../tabs/OfficialSearchesTab';

interface CitizenDashboardProps {
  activeTab: string;
}

export default function CitizenDashboard({ activeTab }: CitizenDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCooperatives: 0,
    totalMembers: 0,
    totalCounties: 0,
    trainingPrograms: 0
  });
  const [featuredCooperatives, setFeaturedCooperatives] = useState<any[]>([]);
  const [recentNews, setRecentNews] = useState<any[]>([]);
  const [showRegistrationWizard, setShowRegistrationWizard] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPublicData();
  }, []);

  const loadPublicData = async () => {
    await Promise.all([
      loadStatistics(),
      loadFeaturedCooperatives(),
      loadRecentNews()
    ]);
    setLoading(false);
  };

  const loadStatistics = async () => {
    const { count: coopsCount } = await supabase
      .from('cooperatives')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    const { count: membersCount } = await supabase
      .from('cooperative_members')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    const { count: countiesCount } = await supabase
      .from('tenants')
      .select('*', { count: 'exact' })
      .eq('type', 'COUNTY');

    const { count: trainingCount } = await supabase
      .from('training_programs')
      .select('*', { count: 'exact' });

    setStats({
      totalCooperatives: coopsCount || 0,
      totalMembers: membersCount || 0,
      totalCounties: countiesCount || 0,
      trainingPrograms: trainingCount || 0
    });
  };

  const loadFeaturedCooperatives = async () => {
    const { data } = await supabase
      .from('cooperatives')
      .select(`
        name,
        total_members,
        cooperative_types(category),
        tenants(name)
      `)
      .eq('is_active', true)
      .eq('status', 'ACTIVE')
      .order('total_members', { ascending: false })
      .limit(4);

    setFeaturedCooperatives(data || []);
  };

  const loadRecentNews = async () => {
    const { data } = await supabase
      .from('inquiry_requests')
      .select('subject, created_at, status')
      .order('created_at', { ascending: false })
      .limit(3);

    setRecentNews(data || []);
  };

  const handleRegistrationSuccess = (applicationNumber: string) => {
    setShowRegistrationWizard(false);
    setSuccessMessage(`Application ${applicationNumber} submitted successfully! Your application is now under review.`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  if (activeTab === 'complaints') {
    return <ComplaintsTab role="CITIZEN" tenantId={undefined} />;
  }

  if (activeTab === 'auditors') {
    return <AuditorsTab role="CITIZEN" />;
  }

  if (activeTab === 'trainers') {
    return <TrainersTab role="CITIZEN" />;
  }

  if (activeTab === 'searches') {
    return <OfficialSearchesTab role="CITIZEN" />;
  }

  if (activeTab !== 'overview') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </h2>
        <p className="text-gray-600">Explore {activeTab} information and resources...</p>
      </div>
    );
  }

  const quickActions = [
    { icon: Search, title: 'Search Cooperatives', description: 'Find registered cooperatives in Kenya', color: 'bg-red-600' },
    { icon: FileText, title: 'Submit Inquiry', description: 'Request information or assistance', color: 'bg-green-700' },
    { icon: BookOpen, title: 'Training Programs', description: 'Browse available training courses', color: 'bg-green-600' },
    { icon: HelpCircle, title: 'Help & Support', description: 'Get answers to common questions', color: 'bg-gray-700' }
  ];

  const statistics = [
    { label: 'Registered Cooperatives', value: stats.totalCooperatives.toLocaleString(), icon: Building2 },
    { label: 'Total Members Nationwide', value: stats.totalMembers.toLocaleString(), icon: TrendingUp },
    { label: 'Counties Covered', value: stats.totalCounties.toString(), icon: Map },
    { label: 'Training Programs', value: stats.trainingPrograms.toLocaleString(), icon: BookOpen }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-500 rounded-lg p-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      <div className="bg-gradient-to-r from-red-600 via-gray-900 to-green-700 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold mb-3">Welcome to CMIS</h2>
            <p className="text-xl text-gray-100 mb-6">
              Explore cooperative services, find registered cooperatives, and access training programs across Kenya.
            </p>
            <div className="flex items-center space-x-3 bg-white rounded-lg p-2">
              <Search className="h-5 w-5 text-gray-400 ml-2" />
              <input
                type="text"
                placeholder="Search for cooperatives by name, type, or location..."
                className="flex-1 py-2 px-2 text-gray-900 focus:outline-none"
              />
              <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-semibold transition-colors">
                Search
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowRegistrationWizard(true)}
            className="bg-white text-red-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition-colors flex items-center space-x-2 shadow-lg"
          >
            <PlusCircle className="h-6 w-6" />
            <span>Register New Cooperative</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, index) => (
          <button
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-red-300 transition-all text-left group"
          >
            <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <action.icon className="h-6 w-6 text-white" />
            </div>
            <p className="font-bold text-gray-900 mb-2">{action.title}</p>
            <p className="text-sm text-gray-600">{action.description}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Cooperative Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statistics.map((stat, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <stat.icon className="h-10 w-10 text-red-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Featured Cooperatives</h3>
            <button className="text-sm text-red-600 font-semibold hover:text-red-700">View All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredCooperatives.length === 0 ? (
              <p className="text-gray-500 col-span-2 text-center py-4">No featured cooperatives available</p>
            ) : (
              featuredCooperatives.map((coop, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{coop.name}</p>
                      <p className="text-sm text-gray-600">
                        {(coop.cooperative_types as any)?.category || 'N/A'} - {(coop.tenants as any)?.name || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {(coop.total_members || 0).toLocaleString()} active members
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Latest Updates</h3>
          <div className="space-y-4">
            {recentNews.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent updates available</p>
            ) : (
              recentNews.map((news, index) => (
                <div key={index} className="pb-4 border-b border-gray-200 last:border-0 last:pb-0 hover:bg-gray-50 p-3 rounded transition-colors cursor-pointer">
                  <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded mb-2">
                    {news.status || 'Update'}
                  </span>
                  <p className="font-semibold text-gray-900 mb-1">{news.subject}</p>
                  <p className="text-xs text-gray-600">
                    {news.created_at ? new Date(news.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              ))
            )}
          </div>
          <button className="w-full mt-4 border border-gray-300 hover:border-red-600 text-gray-700 hover:text-red-600 font-semibold py-2 px-4 rounded-lg transition-colors">
            View All Updates
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-700 to-green-800 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">Join a Cooperative</h3>
            <p className="text-green-100 mb-4">
              Discover the benefits of cooperative membership and find the right cooperative for you.
            </p>
            <button className="bg-white text-green-700 px-6 py-3 rounded-lg font-bold hover:bg-green-50 transition-colors">
              Learn More
            </button>
          </div>
          <Building2 className="h-24 w-24 text-white opacity-20" />
        </div>
      </div>

      {showRegistrationWizard && (
        <RegistrationWizard
          onClose={() => setShowRegistrationWizard(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </div>
  );
}
