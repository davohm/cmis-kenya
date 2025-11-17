import { Building2, Users, TrendingUp, AlertCircle, CheckCircle, Clock, FileText, Award } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import ApplicationsTab from '../tabs/ApplicationsTab';
import CooperativesTab from '../tabs/CooperativesTab';
import MembersTab from '../tabs/MembersTab';
import ComplianceTab from '../tabs/ComplianceTab';
import AmendmentsTab from '../tabs/AmendmentsTab';
import ComplaintsTab from '../tabs/ComplaintsTab';
import AuditorsTab from '../tabs/AuditorsTab';
import TrainersTab from '../tabs/TrainersTab';
import OfficialSearchesTab from '../tabs/OfficialSearchesTab';
import IntegrationsTab from './IntegrationsTab';
import CountyManagementTab from '../tabs/CountyManagementTab';
import CooperativesManagementTab from '../tabs/CooperativesManagementTab';
import DocumentManagementTab from '../tabs/DocumentManagementTab';
import UserManagementTab from '../tabs/UserManagementTab';
import SystemHealthTab from '../tabs/SystemHealthTab';
import AuditLogTab from '../tabs/AuditLogTab';
import MemberManagementTab from '../tabs/MemberManagementTab';
import SystemSettingsTab from '../tabs/SystemSettingsTab';
import AnalyticsTab from '../tabs/AnalyticsTab';
import { Plus, UserPlus, Upload } from 'lucide-react';

interface SuperAdminDashboardProps {
  activeTab: string;
}

export default function SuperAdminDashboard({ activeTab }: SuperAdminDashboardProps) {
  const [stats, setStats] = useState({
    totalCooperatives: 0,
    pendingApplications: 0,
    activeMembers: 0,
    totalRevenue: 0,
    complianceRate: 0,
    totalCounties: 0,
    countyStaff: 0
  });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [countyPerformance, setCountyPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadStats = async () => {
    // Optimized: Only get count without fetching data (uses head: true)
    const { count: coopsCount } = await supabase
      .from('cooperatives')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Fetch only share capital column for sum calculation (server-side SUM not available in Supabase client)
    const { data: coops } = await supabase
      .from('cooperatives')
      .select('total_share_capital')
      .eq('is_active', true);

    // Optimized: Only get count without fetching data (uses head: true)
    const { count: appsCount } = await supabase
      .from('registration_applications')
      .select('*', { count: 'exact', head: true })
      .in('status', ['SUBMITTED', 'UNDER_REVIEW']);

    // Optimized: Only get count without fetching data (uses head: true)
    const { count: membersCount } = await supabase
      .from('cooperative_members')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Calculate total share capital (requires fetching data for sum calculation)
    const totalShareCapital = coops?.reduce((sum, coop) => sum + (Number(coop.total_share_capital) || 0), 0) || 0;

    // Calculate compliance rate from compliance reports
    const { data: complianceData } = await supabase
      .from('compliance_reports')
      .select('compliance_score');
    
    const avgCompliance = complianceData && complianceData.length > 0
      ? Math.round(complianceData.reduce((sum, r) => sum + (r.compliance_score || 0), 0) / complianceData.length)
      : 0;

    // Optimized: Only get count without fetching data (uses head: true)
    const { count: countiesCount } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'COUNTY')
      .eq('is_active', true);

    // Optimized: Only get count without fetching data (uses head: true)
    const { count: staffCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .in('role', ['COUNTY_ADMIN', 'COUNTY_OFFICER'])
      .eq('is_active', true);

    setStats({
      totalCooperatives: coopsCount || 0,
      pendingApplications: appsCount || 0,
      activeMembers: membersCount || 0,
      totalRevenue: totalShareCapital,
      complianceRate: avgCompliance,
      totalCounties: countiesCount || 0,
      countyStaff: staffCount || 0
    });
  };

  const loadRecentApplications = async () => {
    const { data } = await supabase
      .from('registration_applications')
      .select(`
        proposed_name,
        status,
        submitted_at,
        cooperative_types(category),
        tenants(name)
      `)
      .in('status', ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'])
      .order('submitted_at', { ascending: false })
      .limit(3);

    setRecentApplications(data || []);
  };

  const loadCountyPerformance = async () => {
    const { data: cooperatives } = await supabase
      .from('cooperatives')
      .select('tenant_id, tenants(name)');

    const { data: compliance } = await supabase
      .from('compliance_reports')
      .select('cooperative_id, compliance_score, cooperatives(tenant_id)');

    // Group by county
    const countyMap = new Map();
    cooperatives?.forEach(coop => {
      const tenantName = (coop.tenants as any)?.name;
      if (tenantName) {
        const existing = countyMap.get(tenantName) || { name: tenantName, cooperatives: 0, totalCompliance: 0, count: 0 };
        existing.cooperatives += 1;
        countyMap.set(tenantName, existing);
      }
    });

    compliance?.forEach(report => {
      const tenantId = (report.cooperatives as any)?.tenant_id;
      const coop = cooperatives?.find(c => c.tenant_id === tenantId);
      const tenantName = (coop?.tenants as any)?.name;
      if (tenantName && report.compliance_score) {
        const existing = countyMap.get(tenantName);
        if (existing) {
          existing.totalCompliance += report.compliance_score;
          existing.count += 1;
        }
      }
    });

    const performanceData = Array.from(countyMap.values())
      .map(county => ({
        name: county.name,
        cooperatives: county.cooperatives,
        compliance: county.count > 0 ? Math.round(county.totalCompliance / county.count) : 0,
        color: county.count > 0 && (county.totalCompliance / county.count) >= 85 ? 'bg-green-500' : 'bg-yellow-500'
      }))
      .sort((a, b) => b.compliance - a.compliance)
      .slice(0, 5);

    setCountyPerformance(performanceData);
  };

  const loadDashboardData = async () => {
    await Promise.all([loadStats(), loadRecentApplications(), loadCountyPerformance()]);
    setLoading(false);
  };

  if (activeTab === 'applications') {
    return <ApplicationsTab role="SUPER_ADMIN" tenantId={undefined} />;
  }

  if (activeTab === 'cooperatives') {
    return <CooperativesTab role="SUPER_ADMIN" tenantId={undefined} />;
  }

  if (activeTab === 'members') {
    return <MembersTab role="SUPER_ADMIN" tenantId={undefined} />;
  }

  if (activeTab === 'compliance') {
    return <ComplianceTab role="SUPER_ADMIN" tenantId={undefined} />;
  }

  if (activeTab === 'amendments') {
    return <AmendmentsTab role="SUPER_ADMIN" tenantId={undefined} />;
  }

  if (activeTab === 'complaints') {
    return <ComplaintsTab role="SUPER_ADMIN" tenantId={undefined} />;
  }

  if (activeTab === 'auditors') {
    return <AuditorsTab role="SUPER_ADMIN" />;
  }

  if (activeTab === 'trainers') {
    return <TrainersTab role="SUPER_ADMIN" />;
  }

  if (activeTab === 'searches') {
    return <OfficialSearchesTab role="SUPER_ADMIN" />;
  }

  if (activeTab === 'counties') {
    return <CountyManagementTab />;
  }

  if (activeTab === 'cooperatives_management') {
    return <CooperativesManagementTab />;
  }

  if (activeTab === 'integrations') {
    return <IntegrationsTab />;
  }

  if (activeTab === 'documents') {
    return <DocumentManagementTab />;
  }

  if (activeTab === 'users') {
    return <UserManagementTab />;
  }

  if (activeTab === 'system-health') {
    return <SystemHealthTab />;
  }

  if (activeTab === 'audit-logs') {
    return <AuditLogTab />;
  }

  if (activeTab === 'member-management') {
    return <MemberManagementTab />;
  }

  if (activeTab === 'system-settings') {
    return <SystemSettingsTab />;
  }

  if (activeTab === 'analytics') {
    return <AnalyticsTab />;
  }

  if (activeTab !== 'overview') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </h2>
        <p className="text-gray-600">Detailed {activeTab} management interface coming soon...</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Cooperatives',
      value: stats.totalCooperatives.toLocaleString(),
      icon: Building2,
      color: 'bg-red-600',
      change: `${stats.totalCooperatives} active`
    },
    {
      label: 'Pending Applications',
      value: stats.pendingApplications.toLocaleString(),
      icon: Clock,
      color: 'bg-yellow-600',
      change: 'Requires review'
    },
    {
      label: 'Active Members',
      value: stats.activeMembers.toLocaleString(),
      icon: Users,
      color: 'bg-green-700',
      change: 'Nationwide'
    },
    {
      label: 'Share Capital',
      value: `KES ${(stats.totalRevenue / 1000000).toFixed(1)}M`,
      icon: TrendingUp,
      color: 'bg-gray-800',
      change: 'Total value'
    },
    {
      label: 'Total Counties',
      value: stats.totalCounties.toLocaleString(),
      icon: Building2,
      color: 'bg-blue-600',
      change: 'Active counties'
    },
    {
      label: 'County Staff',
      value: stats.countyStaff.toLocaleString(),
      icon: Users,
      color: 'bg-purple-600',
      change: 'Admin & Officers'
    }
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
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">National Overview</h2>
        <p className="text-gray-600">Real-time insights across all 47 counties</p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.hash = '#cooperatives_management'}
            className="flex items-center space-x-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors text-left"
          >
            <div className="bg-red-600 p-2 rounded-lg">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Create Cooperative</p>
              <p className="text-sm text-gray-600">Add a new cooperative</p>
            </div>
          </button>
          <button
            onClick={() => window.location.hash = '#users'}
            className="flex items-center space-x-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
          >
            <div className="bg-green-700 p-2 rounded-lg">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Create User</p>
              <p className="text-sm text-gray-600">Add a new user account</p>
            </div>
          </button>
          <button
            onClick={() => window.location.hash = '#documents'}
            className="flex items-center space-x-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
          >
            <div className="bg-blue-600 p-2 rounded-lg">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Upload Document</p>
              <p className="text-sm text-gray-600">Add a new document</p>
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-600">{stat.change}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Applications</h3>
            <button className="text-sm text-red-600 font-semibold hover:text-red-700">View All</button>
          </div>
          <div className="space-y-4">
            {recentApplications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent applications</p>
            ) : (
              recentApplications.map((app, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{app.proposed_name}</p>
                    <p className="text-sm text-gray-600">
                      {(app.cooperative_types as any)?.category || 'N/A'} - {(app.tenants as any)?.name || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      app.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      app.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {app.status.replace('_', ' ')}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Top Counties by Performance</h3>
            <Award className="h-5 w-5 text-red-600" />
          </div>
          <div className="space-y-4">
            {countyPerformance.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No county data available</p>
            ) : (
              countyPerformance.map((county, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{county.name}</p>
                        <p className="text-sm text-gray-600">{county.cooperatives.toLocaleString()} cooperatives</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{county.compliance}%</p>
                      <p className="text-xs text-gray-600">Compliance</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`${county.color} h-2 rounded-full`} style={{ width: `${county.compliance}%` }}></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg p-6 text-white">
          <FileText className="h-10 w-10 mb-4 text-white opacity-80" />
          <p className="text-3xl font-bold mb-2">124</p>
          <p className="text-red-100">Pending Reviews</p>
          <button className="mt-4 bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors">
            Review Now
          </button>
        </div>

        <div className="bg-gradient-to-br from-green-700 to-green-800 rounded-xl shadow-lg p-6 text-white">
          <CheckCircle className="h-10 w-10 mb-4 text-white opacity-80" />
          <p className="text-3xl font-bold mb-2">87%</p>
          <p className="text-green-100">Overall Compliance Rate</p>
          <button className="mt-4 bg-white text-green-700 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors">
            View Details
          </button>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-6 text-white">
          <AlertCircle className="h-10 w-10 mb-4 text-white opacity-80" />
          <p className="text-3xl font-bold mb-2">23</p>
          <p className="text-gray-200">Urgent Actions Required</p>
          <button className="mt-4 bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
            Take Action
          </button>
        </div>
      </div>
    </div>
  );
}
