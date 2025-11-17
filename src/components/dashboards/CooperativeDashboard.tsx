import { Users, TrendingUp, FileText, DollarSign, Calendar, CheckCircle, AlertCircle, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';
import CooperativesTab from '../tabs/CooperativesTab';
import MembersTab from '../tabs/MembersTab';
import ComplianceTab from '../tabs/ComplianceTab';
import AmendmentsTab from '../tabs/AmendmentsTab';
import ComplaintsTab from '../tabs/ComplaintsTab';
import AuditorsTab from '../tabs/AuditorsTab';
import TrainersTab from '../tabs/TrainersTab';
import OfficialSearchesTab from '../tabs/OfficialSearchesTab';

interface CooperativeDashboardProps {
  activeTab: string;
}

export default function CooperativeDashboard({ activeTab }: CooperativeDashboardProps) {
  const { profile } = useAuth();
  const [coopInfo, setCoopInfo] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadCooperativeData();
    }
  }, [profile?.id]);

  const loadCooperativeData = async () => {
    if (!profile?.id) return;

    // Find cooperative where user is a member or admin
    const { data: memberData } = await supabase
      .from('cooperative_members')
      .select('cooperative_id, cooperatives(*)')
      .eq('user_id', profile.id)
      .limit(1)
      .maybeSingle();

    if (!memberData) {
      // If not a member, try to find cooperative from their tenant for COOPERATIVE_ADMIN role
      const { data: coopData } = await supabase
        .from('cooperatives')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .limit(1)
        .maybeSingle();

      if (coopData) {
        await loadCooperativeDetails(coopData.id);
      } else {
        setLoading(false);
      }
    } else {
      const cooperative = (memberData.cooperatives as any);
      await loadCooperativeDetails(cooperative.id);
    }
  };

  const loadCooperativeDetails = async (cooperativeId: string) => {
    // Fetch cooperative details
    const { data: coop } = await supabase
      .from('cooperatives')
      .select('*, cooperative_types(name, category)')
      .eq('id', cooperativeId)
      .single();

    // Fetch member count
    const { count: memberCount } = await supabase
      .from('cooperative_members')
      .select('*', { count: 'exact' })
      .eq('cooperative_id', cooperativeId)
      .eq('is_active', true);

    // Fetch compliance data
    const { data: compliance } = await supabase
      .from('compliance_reports')
      .select('compliance_score, status')
      .eq('cooperative_id', cooperativeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch pending compliance reports
    const { data: pendingCompliance } = await supabase
      .from('compliance_reports')
      .select('*')
      .eq('cooperative_id', cooperativeId)
      .eq('status', 'PENDING_REVIEW');

    setCoopInfo({
      ...coop,
      id: cooperativeId,
      memberCount: memberCount || 0,
      complianceScore: compliance?.compliance_score || 0,
      complianceStatus: compliance?.status || 'PENDING_REVIEW'
    });

    setStats([
      { 
        label: 'Total Members', 
        value: (memberCount || 0).toLocaleString(), 
        icon: Users, 
        color: 'bg-green-700', 
        trend: `${memberCount || 0} active members` 
      },
      { 
        label: 'Share Capital', 
        value: `KES ${((coop?.total_share_capital || 0) / 1000000).toFixed(1)}M`, 
        icon: DollarSign, 
        color: 'bg-red-600', 
        trend: 'Total value' 
      },
      { 
        label: 'Member Shares', 
        value: (coop?.total_members || 0).toLocaleString(), 
        icon: TrendingUp, 
        color: 'bg-gray-800', 
        trend: 'Registered members' 
      },
      { 
        label: 'Compliance Score', 
        value: `${compliance?.compliance_score || 0}%`, 
        icon: Award, 
        color: 'bg-green-600', 
        trend: compliance?.status || 'Pending' 
      }
    ]);

    setPendingActions([
      { 
        title: 'Submit Annual Return', 
        deadline: `${pendingCompliance?.length || 0} reports pending`, 
        priority: 'high', 
        icon: FileText 
      },
      { 
        title: 'Update Member List', 
        deadline: 'Keep records current', 
        priority: 'medium', 
        icon: Users 
      }
    ]);

    setLoading(false);
  };

  if (activeTab === 'cooperatives') {
    return <CooperativesTab role="COOPERATIVE_ADMIN" tenantId={profile?.tenant_id} cooperativeId={coopInfo?.id} />;
  }

  if (activeTab === 'members') {
    return <MembersTab role="COOPERATIVE_ADMIN" cooperativeId={coopInfo?.id} />;
  }

  if (activeTab === 'compliance') {
    return <ComplianceTab role="COOPERATIVE_ADMIN" cooperativeId={coopInfo?.id} />;
  }

  if (activeTab === 'amendments') {
    return <AmendmentsTab role="COOPERATIVE_ADMIN" cooperativeId={coopInfo?.id} />;
  }

  if (activeTab === 'complaints') {
    return <ComplaintsTab role="COOPERATIVE_ADMIN" cooperativeId={coopInfo?.id} />;
  }

  if (activeTab === 'auditors') {
    return <AuditorsTab role="COOPERATIVE_ADMIN" />;
  }

  if (activeTab === 'trainers') {
    return <TrainersTab role="COOPERATIVE_ADMIN" />;
  }

  if (activeTab === 'searches') {
    return <OfficialSearchesTab role="COOPERATIVE_ADMIN" />;
  }

  if (activeTab !== 'overview') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </h2>
        <p className="text-gray-600">Detailed {activeTab} management for your cooperative...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading cooperative dashboard...</div>
      </div>
    );
  }

  if (!coopInfo) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Cooperative Found</h2>
        <p className="text-gray-600">You are not associated with any cooperative.</p>
      </div>
    );
  }

  const recentTransactions = [
    { type: 'Payment', description: 'Annual levy payment', amount: 'KES 50,000', date: new Date().toLocaleDateString(), status: 'completed' },
    { type: 'Document', description: 'Compliance report uploaded', amount: '-', date: new Date().toLocaleDateString(), status: 'completed' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-600 via-gray-900 to-green-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">{coopInfo.name}</h2>
            <p className="text-gray-100 mb-3">Registration No: {coopInfo.registration_number || 'N/A'}</p>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                coopInfo.status === 'ACTIVE' ? 'bg-green-500 bg-opacity-30' : 'bg-yellow-500 bg-opacity-30'
              }`}>
                {coopInfo.status}
              </span>
              <span className="text-sm text-gray-200">
                {coopInfo.memberCount.toLocaleString()} Active Members
              </span>
            </div>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-xs">{coopInfo.complianceStatus}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Transactions</h3>
            <button className="text-sm text-red-600 font-semibold hover:text-red-700">View All</button>
          </div>
          <div className="space-y-3">
            {recentTransactions.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {transaction.type.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-600">{transaction.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{transaction.amount}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                    transaction.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="text-xl font-bold text-gray-900">Action Required</h3>
          </div>
          <div className="space-y-3">
            {pendingActions.map((action, index) => (
              <div key={index} className="p-4 border-l-4 border-gray-200 bg-gray-50 rounded hover:border-red-600 transition-colors">
                <div className="flex items-start space-x-3">
                  <action.icon className={`h-5 w-5 flex-shrink-0 ${
                    action.priority === 'high' ? 'text-red-600' :
                    action.priority === 'medium' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`} />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm mb-1">{action.title}</p>
                    <p className="text-xs text-gray-600">{action.deadline}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${
                    action.priority === 'high' ? 'bg-red-100 text-red-700' :
                    action.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {action.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button className="bg-red-600 hover:bg-red-700 text-white rounded-xl p-6 transition-colors shadow-md hover:shadow-lg">
          <FileText className="h-8 w-8 mb-3" />
          <p className="font-bold text-lg">Submit Documents</p>
          <p className="text-sm text-red-100 mt-1">Upload required reports</p>
        </button>

        <button className="bg-green-700 hover:bg-green-800 text-white rounded-xl p-6 transition-colors shadow-md hover:shadow-lg">
          <Users className="h-8 w-8 mb-3" />
          <p className="font-bold text-lg">Manage Members</p>
          <p className="text-sm text-green-100 mt-1">Add or update members</p>
        </button>

        <button className="bg-gray-800 hover:bg-gray-900 text-white rounded-xl p-6 transition-colors shadow-md hover:shadow-lg">
          <DollarSign className="h-8 w-8 mb-3" />
          <p className="font-bold text-lg">Apply for Loan</p>
          <p className="text-sm text-gray-300 mt-1">Submit loan application</p>
        </button>

        <button className="bg-green-600 hover:bg-green-700 text-white rounded-xl p-6 transition-colors shadow-md hover:shadow-lg">
          <Calendar className="h-8 w-8 mb-3" />
          <p className="font-bold text-lg">Book Training</p>
          <p className="text-sm text-green-100 mt-1">Register for programs</p>
        </button>
      </div>
    </div>
  );
}
