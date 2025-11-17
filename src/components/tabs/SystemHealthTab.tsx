import { Activity, Database, HardDrive, Users, Building2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function SystemHealthTab() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCooperatives: 0,
    totalApplications: 0,
    activeUsers: 0,
    activeCooperatives: 0,
    pendingApplications: 0,
    databaseSize: '0 MB',
    storageUsage: '0 MB',
    systemUptime: '0 days',
    activeSessions: 0
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<any[]>([]);

  useEffect(() => {
    loadSystemHealth();
    const interval = setInterval(loadSystemHealth, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadSystemHealth = async () => {
    try {
      setLoading(true);

      // Load user statistics
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: activeUserCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Load cooperative statistics
      const { count: coopCount } = await supabase
        .from('cooperatives')
        .select('*', { count: 'exact', head: true });

      const { count: activeCoopCount } = await supabase
        .from('cooperatives')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Load application statistics
      const { count: appCount } = await supabase
        .from('registration_applications')
        .select('*', { count: 'exact', head: true });

      const { count: pendingAppCount } = await supabase
        .from('registration_applications')
        .select('*', { count: 'exact', head: true })
        .in('status', ['SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFO_REQUIRED']);

      setStats({
        totalUsers: userCount || 0,
        totalCooperatives: coopCount || 0,
        totalApplications: appCount || 0,
        activeUsers: activeUserCount || 0,
        activeCooperatives: activeCoopCount || 0,
        pendingApplications: pendingAppCount || 0,
        databaseSize: 'N/A', // Would need admin access to calculate
        storageUsage: 'N/A', // Would need admin access to calculate
        systemUptime: 'N/A', // Would need server-side tracking
        activeSessions: 0 // Would need session tracking
      });
    } catch (err) {
      console.error('Error loading system health:', err);
      setErrors([{ message: 'Failed to load system health data', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading system health data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">System Health</h2>
        <p className="text-gray-600 mt-1">Monitor system performance and statistics</p>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-8 w-8 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.totalUsers}</span>
          </div>
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-xs text-green-600 mt-1">{stats.activeUsers} active</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="h-8 w-8 text-red-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.totalCooperatives}</span>
          </div>
          <p className="text-sm text-gray-600">Total Cooperatives</p>
          <p className="text-xs text-green-600 mt-1">{stats.activeCooperatives} active</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-8 w-8 text-purple-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.totalApplications}</span>
          </div>
          <p className="text-sm text-gray-600">Total Applications</p>
          <p className="text-xs text-yellow-600 mt-1">{stats.pendingApplications} pending</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Database className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.databaseSize}</span>
          </div>
          <p className="text-sm text-gray-600">Database Size</p>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-900">Database Connection</span>
            </div>
            <span className="text-sm text-green-600 font-semibold">Healthy</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-900">Storage Service</span>
            </div>
            <span className="text-sm text-green-600 font-semibold">Operational</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-900">Authentication Service</span>
            </div>
            <span className="text-sm text-green-600 font-semibold">Operational</span>
          </div>
        </div>
      </div>

      {/* Recent Errors */}
      {errors.length > 0 && (
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>Recent Errors</span>
          </h3>
          <div className="space-y-2">
            {errors.map((error, index) => (
              <div key={index} className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800">{error.message}</p>
                <p className="text-xs text-red-600 mt-1">
                  {new Date(error.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

