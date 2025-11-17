import { TrendingUp, Building2, Users, FileText, Award, Calendar, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface AnalyticsData {
  cooperatives: {
    total: number;
    active: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    growth: number;
  };
  members: {
    total: number;
    active: number;
    growth: number;
  };
  applications: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byMonth: Array<{ month: string; count: number }>;
  };
  counties: {
    total: number;
    withCooperatives: number;
    topPerformers: Array<{ name: string; cooperatives: number; members: number; compliance: number }>;
  };
}

export default function AnalyticsTab() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Load cooperatives data
      const { count: totalCooperatives } = await supabase
        .from('cooperatives')
        .select('*', { count: 'exact', head: true });

      const { count: activeCooperatives } = await supabase
        .from('cooperatives')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Load members data
      const { count: totalMembers } = await supabase
        .from('cooperative_members')
        .select('*', { count: 'exact', head: true });

      const { count: activeMembers } = await supabase
        .from('cooperative_members')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Load applications data
      const { count: totalApplications } = await supabase
        .from('registration_applications')
        .select('*', { count: 'exact', head: true });

      const { count: pendingApplications } = await supabase
        .from('registration_applications')
        .select('*', { count: 'exact', head: true })
        .in('status', ['SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFO_REQUIRED']);

      const { count: approvedApplications } = await supabase
        .from('registration_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'APPROVED');

      // Load county data
      const { data: countyData } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('tenant_type', 'COUNTY')
        .eq('is_active', true);

      const { data: cooperativesByCounty } = await supabase
        .from('cooperatives')
        .select('tenant_id, total_members')
        .eq('is_active', true);

      const countyStats = (countyData || []).map(county => {
        const countyCoops = cooperativesByCounty?.filter(c => c.tenant_id === county.id) || [];
        const totalMembers = countyCoops.reduce((sum, c) => sum + (c.total_members || 0), 0);
        return {
          name: county.name,
          cooperatives: countyCoops.length,
          members: totalMembers,
          compliance: Math.min(95, 60 + Math.random() * 35) // Mock compliance score
        };
      }).sort((a, b) => b.compliance - a.compliance).slice(0, 10);

      setAnalytics({
        cooperatives: {
          total: totalCooperatives || 0,
          active: activeCooperatives || 0,
          byStatus: {},
          byType: {},
          growth: 12.5 // Mock growth
        },
        members: {
          total: totalMembers || 0,
          active: activeMembers || 0,
          growth: 8.3 // Mock growth
        },
        applications: {
          total: totalApplications || 0,
          pending: pendingApplications || 0,
          approved: approvedApplications || 0,
          rejected: 0,
          byMonth: []
        },
        counties: {
          total: countyData?.length || 0,
          withCooperatives: countyStats.length,
          topPerformers: countyStats
        }
      });
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">Comprehensive insights and trends across the system</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
            <option value="all">All time</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="h-8 w-8 text-red-600" />
            <span className={`text-sm font-semibold ${analytics.cooperatives.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analytics.cooperatives.growth >= 0 ? '+' : ''}{analytics.cooperatives.growth}%
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.cooperatives.total.toLocaleString()}</p>
          <p className="text-sm text-gray-600 mt-1">Total Cooperatives</p>
          <p className="text-xs text-gray-500 mt-1">{analytics.cooperatives.active} active</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-8 w-8 text-blue-600" />
            <span className={`text-sm font-semibold ${analytics.members.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analytics.members.growth >= 0 ? '+' : ''}{analytics.members.growth}%
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.members.total.toLocaleString()}</p>
          <p className="text-sm text-gray-600 mt-1">Total Members</p>
          <p className="text-xs text-gray-500 mt-1">{analytics.members.active} active</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <FileText className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.applications.total.toLocaleString()}</p>
          <p className="text-sm text-gray-600 mt-1">Total Applications</p>
          <p className="text-xs text-gray-500 mt-1">{analytics.applications.pending} pending</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Award className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.applications.approved.toLocaleString()}</p>
          <p className="text-sm text-gray-600 mt-1">Approved Applications</p>
          <p className="text-xs text-gray-500 mt-1">
            {analytics.applications.total > 0 
              ? Math.round((analytics.applications.approved / analytics.applications.total) * 100)
              : 0}% approval rate
          </p>
        </div>
      </div>

      {/* Top Performing Counties */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Top Performing Counties</h3>
        <div className="space-y-4">
          {analytics.counties.topPerformers.map((county, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-700 font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{county.name}</p>
                  <p className="text-sm text-gray-600">
                    {county.cooperatives} cooperatives • {county.members.toLocaleString()} members
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{county.compliance.toFixed(1)}%</p>
                <p className="text-xs text-gray-600">Compliance</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Application Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Application Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full" 
                    style={{ width: `${(analytics.applications.pending / analytics.applications.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                  {analytics.applications.pending}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Approved</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(analytics.applications.approved / analytics.applications.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                  {analytics.applications.approved}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">System Overview</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Total Counties</span>
              <span className="text-sm font-semibold text-gray-900">{analytics.counties.total}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Counties with Cooperatives</span>
              <span className="text-sm font-semibold text-gray-900">{analytics.counties.withCooperatives}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Average Cooperatives per County</span>
              <span className="text-sm font-semibold text-gray-900">
                {analytics.counties.withCooperatives > 0
                  ? Math.round(analytics.cooperatives.total / analytics.counties.withCooperatives)
                  : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

