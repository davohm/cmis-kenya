import { Building2, Users, FileCheck, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';
import ApplicationsTab from '../tabs/ApplicationsTab';
import CooperativesTab from '../tabs/CooperativesTab';
import MembersTab from '../tabs/MembersTab';
import ComplianceTab from '../tabs/ComplianceTab';
import AmendmentsTab from '../tabs/AmendmentsTab';
import ComplaintsTab from '../tabs/ComplaintsTab';
import AuditorsTab from '../tabs/AuditorsTab';
import TrainersTab from '../tabs/TrainersTab';
import OfficialSearchesTab from '../tabs/OfficialSearchesTab';

interface CountyAdminDashboardProps {
  activeTab: string;
}

export default function CountyAdminDashboard({ activeTab }: CountyAdminDashboardProps) {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    cooperatives: 0,
    members: 0,
    pendingApps: 0,
    complianceIssues: 0,
    revenue: 0,
    complianceRate: 0,
    newMembers: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.tenant_id) {
      loadDashboardData();
    }
  }, [profile?.tenant_id]);

  const loadDashboardData = async () => {
    if (!profile?.tenant_id) return;

    // Fetch county cooperatives
    const { data: coops, count: coopsCount } = await supabase
      .from('cooperatives')
      .select('*', { count: 'exact' })
      .eq('tenant_id', profile.tenant_id)
      .eq('is_active', true);

    // Fetch total members in county
    const cooperativeIds = coops?.map(c => c.id) || [];
    const { count: membersCount } = await supabase
      .from('cooperative_members')
      .select('*', { count: 'exact' })
      .in('cooperative_id', cooperativeIds)
      .eq('is_active', true);

    // Fetch pending applications for county
    const { count: appsCount } = await supabase
      .from('registration_applications')
      .select('*', { count: 'exact' })
      .eq('tenant_id', profile.tenant_id)
      .in('status', ['SUBMITTED', 'UNDER_REVIEW']);

    // Fetch compliance issues
    const { data: complianceData } = await supabase
      .from('compliance_reports')
      .select('*, cooperatives!inner(tenant_id)')
      .eq('cooperatives.tenant_id', profile.tenant_id)
      .eq('status', 'NON_COMPLIANT');

    // Calculate revenue and compliance rate
    const totalRevenue = coops?.reduce((sum, c) => sum + (Number(c.total_share_capital) || 0), 0) || 0;
    
    const { data: allCompliance } = await supabase
      .from('compliance_reports')
      .select('compliance_score, cooperatives!inner(tenant_id)')
      .eq('cooperatives.tenant_id', profile.tenant_id);

    const avgCompliance = allCompliance && allCompliance.length > 0
      ? Math.round(allCompliance.reduce((sum, r) => sum + (r.compliance_score || 0), 0) / allCompliance.length)
      : 0;

    // Fetch recent activity
    const { data: recentApps } = await supabase
      .from('registration_applications')
      .select('proposed_name, status, submitted_at')
      .eq('tenant_id', profile.tenant_id)
      .order('submitted_at', { ascending: false })
      .limit(4);

    const activity = recentApps?.map(app => ({
      type: 'Application',
      cooperative: app.proposed_name,
      action: 'Submitted registration',
      time: app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'N/A',
      status: app.status === 'SUBMITTED' ? 'new' : app.status === 'APPROVED' ? 'complete' : 'pending'
    })) || [];

    setStats({
      cooperatives: coopsCount || 0,
      members: membersCount || 0,
      pendingApps: appsCount || 0,
      complianceIssues: complianceData?.length || 0,
      revenue: totalRevenue,
      complianceRate: avgCompliance,
      newMembers: 0
    });
    setRecentActivity(activity);
    setLoading(false);
  };

  if (activeTab === 'applications') {
    return <ApplicationsTab role="COUNTY_ADMIN" tenantId={profile?.tenant_id} />;
  }

  if (activeTab === 'cooperatives') {
    return <CooperativesTab role="COUNTY_ADMIN" tenantId={profile?.tenant_id} />;
  }

  if (activeTab === 'members') {
    return <MembersTab role="COUNTY_ADMIN" tenantId={profile?.tenant_id} />;
  }

  if (activeTab === 'compliance') {
    return <ComplianceTab role="COUNTY_ADMIN" tenantId={profile?.tenant_id} />;
  }

  if (activeTab === 'amendments') {
    return <AmendmentsTab role="COUNTY_ADMIN" tenantId={profile?.tenant_id} />;
  }

  if (activeTab === 'complaints') {
    return <ComplaintsTab role="COUNTY_ADMIN" tenantId={profile?.tenant_id} />;
  }

  if (activeTab === 'auditors') {
    return <AuditorsTab role="COUNTY_ADMIN" />;
  }

  if (activeTab === 'trainers') {
    return <TrainersTab role="COUNTY_ADMIN" />;
  }

  if (activeTab === 'searches') {
    return <OfficialSearchesTab role="COUNTY_ADMIN" />;
  }

  if (activeTab !== 'overview') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </h2>
        <p className="text-gray-600">Detailed {activeTab} management interface for your county...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading county dashboard...</div>
      </div>
    );
  }

  const countyStats = [
    { label: 'Registered Cooperatives', value: stats.cooperatives.toString(), icon: Building2, color: 'bg-green-700', change: `${stats.cooperatives} in county` },
    { label: 'Total Members', value: stats.members.toLocaleString(), icon: Users, color: 'bg-red-600', change: 'County members' },
    { label: 'Pending Applications', value: stats.pendingApps.toString(), icon: FileCheck, color: 'bg-yellow-600', change: 'Requires action' },
    { label: 'Compliance Issues', value: stats.complianceIssues.toString(), icon: AlertTriangle, color: 'bg-orange-600', change: stats.complianceIssues > 0 ? 'Need attention' : 'All clear' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-700 to-green-800 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">{profile?.roles[0]?.tenant_name || 'County Dashboard'}</h2>
            <p className="text-green-100">Managing cooperative services in your county</p>
          </div>
          <Building2 className="h-16 w-16 text-white opacity-30" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {countyStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm font-medium text-gray-700 mb-2">{stat.label}</p>
            <p className="text-xs text-gray-500">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
            <button className="text-sm text-red-600 font-semibold hover:text-red-700">View All</button>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  activity.status === 'new' ? 'bg-blue-100 text-blue-600' :
                  activity.status === 'complete' ? 'bg-green-100 text-green-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  {activity.type.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{activity.cooperative}</p>
                  <p className="text-sm text-gray-600">{activity.action}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                  activity.status === 'new' ? 'bg-blue-100 text-blue-700' :
                  activity.status === 'complete' ? 'bg-green-100 text-green-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Calendar className="h-5 w-5 text-red-600" />
            <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <div className="p-4 border border-gray-200 rounded-lg hover:border-red-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold text-gray-900 text-sm pr-2">Review Pending Applications</p>
                <span className="px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 bg-red-100 text-red-700">
                  {stats.pendingApps}
                </span>
              </div>
              <p className="text-xs text-gray-600">Applications awaiting review</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:border-red-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold text-gray-900 text-sm pr-2">Address Compliance Issues</p>
                <span className="px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 bg-yellow-100 text-yellow-700">
                  {stats.complianceIssues}
                </span>
              </div>
              <p className="text-xs text-gray-600">Cooperatives needing attention</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 text-white">
          <TrendingUp className="h-8 w-8 mb-3 opacity-80" />
          <p className="text-2xl font-bold mb-1">KES {(stats.revenue / 1000000).toFixed(1)}M</p>
          <p className="text-red-100 text-sm">Share Capital Total</p>
        </div>

        <div className="bg-gradient-to-br from-green-700 to-green-800 rounded-xl p-6 text-white">
          <FileCheck className="h-8 w-8 mb-3 opacity-80" />
          <p className="text-2xl font-bold mb-1">{stats.complianceRate}%</p>
          <p className="text-green-100 text-sm">County Compliance Rate</p>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 text-white">
          <Users className="h-8 w-8 mb-3 opacity-80" />
          <p className="text-2xl font-bold mb-1">{stats.members.toLocaleString()}</p>
          <p className="text-gray-200 text-sm">Total Active Members</p>
        </div>
      </div>
    </div>
  );
}
