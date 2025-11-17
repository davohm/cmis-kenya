import { useEffect, useState } from 'react';
import { FileCheck, Building2, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import OfficialSearchesTab from '../tabs/OfficialSearchesTab';

interface AuditorDashboardProps {
  activeTab: string;
}

interface AuditReport {
  id: string;
  report_number: string;
  cooperative_id: string;
  audit_type: string;
  financial_year: number;
  audit_start_date: string;
  audit_end_date?: string;
  audit_opinion?: string;
  status: string;
  submitted_at: string;
  cooperatives: {
    name: string;
  } | null;
}

interface Stats {
  totalAudits: number;
  pendingAudits: number;
  completedThisYear: number;
  activeCooperatives: number;
}

export default function AuditorDashboard({ activeTab }: AuditorDashboardProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalAudits: 0,
    pendingAudits: 0,
    completedThisYear: 0,
    activeCooperatives: 0
  });
  const [upcomingAudits, setUpcomingAudits] = useState<AuditReport[]>([]);
  const [recentReports, setRecentReports] = useState<AuditReport[]>([]);

  useEffect(() => {
    if (profile?.id) {
      fetchAuditorData();
    }
  }, [profile?.id]);

  const fetchAuditorData = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const { data: allReports, error: reportsError } = await supabase
        .from('audit_reports')
        .select(`
          id,
          report_number,
          cooperative_id,
          audit_type,
          financial_year,
          audit_start_date,
          audit_end_date,
          audit_opinion,
          status,
          submitted_at,
          cooperatives (
            name
          )
        `)
        .eq('auditor_id', profile.id)
        .order('submitted_at', { ascending: false });

      if (reportsError) throw reportsError;

      const reports = allReports || [];
      const currentYear = new Date().getFullYear();

      const totalAudits = reports.length;
      const pendingAudits = reports.filter(r => 
        r.status !== 'APPROVED' && r.status !== 'REJECTED'
      ).length;
      const completedThisYear = reports.filter(r => 
        r.financial_year === currentYear && r.status === 'APPROVED'
      ).length;
      
      const uniqueCooperatives = new Set(reports.map(r => r.cooperative_id));
      const activeCooperatives = uniqueCooperatives.size;

      setStats({
        totalAudits,
        pendingAudits,
        completedThisYear,
        activeCooperatives
      });

      // Transform cooperatives from array to single object
      const transformedReports = reports.map(r => ({
        ...r,
        cooperatives: Array.isArray(r.cooperatives) ? r.cooperatives[0] : r.cooperatives
      })) as AuditReport[];

      const upcoming = transformedReports
        .filter(r => !r.audit_end_date || new Date(r.audit_end_date) >= new Date())
        .sort((a, b) => new Date(a.audit_start_date).getTime() - new Date(b.audit_start_date).getTime())
        .slice(0, 3);

      setUpcomingAudits(upcoming);

      const recent = transformedReports
        .filter(r => r.submitted_at)
        .slice(0, 3);

      setRecentReports(recent);

    } catch (error) {
      console.error('Error fetching auditor data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (activeTab === 'searches') {
    return <OfficialSearchesTab role="AUDITOR" />;
  }

  if (activeTab !== 'overview') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </h2>
        <p className="text-gray-600">Detailed {activeTab} management for auditors...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statsCards = [
    { label: 'Total Audits', value: stats.totalAudits.toString(), icon: FileCheck, color: 'bg-gray-700', trend: 'All time' },
    { label: 'Pending Audits', value: stats.pendingAudits.toString(), icon: Clock, color: 'bg-yellow-600', trend: 'Requires attention' },
    { label: 'Completed This Year', value: stats.completedThisYear.toString(), icon: CheckCircle, color: 'bg-green-700', trend: `Year ${new Date().getFullYear()}` },
    { label: 'Active Cooperatives', value: stats.activeCooperatives.toString(), icon: Building2, color: 'bg-red-600', trend: 'Under audit' }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatAuditType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      'SUBMITTED': { bg: 'bg-blue-100', text: 'text-blue-700' },
      'UNDER_REVIEW': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      'APPROVED': { bg: 'bg-green-100', text: 'text-green-700' },
      'REJECTED': { bg: 'bg-red-100', text: 'text-red-700' },
      'DRAFT': { bg: 'bg-gray-100', text: 'text-gray-700' }
    };
    
    const { bg, text } = statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-700' };
    return `${bg} ${text}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Auditor Dashboard</h2>
            <p className="text-gray-300 mb-3">{profile?.full_name}</p>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-green-500 bg-opacity-30 rounded-full text-sm font-semibold">
                Active Auditor
              </span>
              <span className="text-sm text-gray-300">
                {stats.totalAudits} total audits
              </span>
            </div>
          </div>
          <FileCheck className="h-16 w-16 text-white opacity-20" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
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
              <h3 className="text-xl font-bold text-gray-900">Upcoming Audits</h3>
            </div>
            <button className="text-sm text-red-600 font-semibold hover:text-red-700">View Calendar</button>
          </div>
          <div className="space-y-3">
            {upcomingAudits.length > 0 ? (
              upcomingAudits.map((audit) => (
                <div key={audit.id} className="p-4 border border-gray-200 rounded-lg hover:border-red-300 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{audit.cooperatives?.name || 'Unknown Cooperative'}</p>
                      <p className="text-sm text-gray-600">{formatAuditType(audit.audit_type)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(audit.status)}`}>
                      {audit.status.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(audit.audit_start_date)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No upcoming audits scheduled</p>
            )}
          </div>
          <button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            Schedule New Audit
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Reports</h3>
            <button className="text-sm text-red-600 font-semibold hover:text-red-700">View All</button>
          </div>
          <div className="space-y-3">
            {recentReports.length > 0 ? (
              recentReports.map((report) => (
                <div key={report.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{report.cooperatives?.name || 'Unknown Cooperative'}</p>
                      <p className="text-sm text-gray-600">{formatAuditType(report.audit_type)}</p>
                    </div>
                    {report.audit_opinion && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        report.audit_opinion === 'Unqualified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {report.audit_opinion}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{formatDate(report.submitted_at)}</span>
                    <span className={`font-semibold ${getStatusBadge(report.status).includes('green') ? 'text-green-600' : 'text-blue-600'}`}>
                      {report.status.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No recent reports submitted</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 text-white">
          <AlertCircle className="h-8 w-8 mb-3 opacity-80" />
          <p className="text-2xl font-bold mb-1">{stats.pendingAudits}</p>
          <p className="text-red-100 text-sm mb-4">Audits Need Attention</p>
          <button className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors text-sm">
            Review Now
          </button>
        </div>

        <div className="bg-gradient-to-br from-green-700 to-green-800 rounded-xl p-6 text-white">
          <CheckCircle className="h-8 w-8 mb-3 opacity-80" />
          <p className="text-2xl font-bold mb-1">{stats.completedThisYear}</p>
          <p className="text-green-100 text-sm mb-4">Completed This Year</p>
          <button className="bg-white text-green-700 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors text-sm">
            View Stats
          </button>
        </div>

        <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-6 text-white">
          <FileCheck className="h-8 w-8 mb-3 opacity-80" />
          <p className="text-2xl font-bold mb-1">{stats.activeCooperatives}</p>
          <p className="text-gray-200 text-sm mb-4">Active Cooperatives</p>
          <button className="bg-white text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm">
            View List
          </button>
        </div>
      </div>
    </div>
  );
}
