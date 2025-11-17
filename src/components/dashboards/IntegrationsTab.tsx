import { useEffect, useState } from 'react';
import { Shield, CreditCard, FileText, Building2, CheckCircle, Activity, TrendingUp, RefreshCw, Key, Settings, AlertCircle, Play, Pause } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function IntegrationsTab() {
  const [stats, setStats] = useState({
    iprsVerifications: 0,
    paymentTransactions: 0,
    kraVerifications: 0,
    sasraVerifications: 0,
    totalRevenue: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceStatuses, setServiceStatuses] = useState<Record<string, { enabled: boolean; lastSync: string; apiKey: string }>>({
    IPRS: { enabled: true, lastSync: new Date().toISOString(), apiKey: '••••••••••••••••' },
    eCitizen: { enabled: true, lastSync: new Date().toISOString(), apiKey: '••••••••••••••••' },
    KRA: { enabled: true, lastSync: new Date().toISOString(), apiKey: '••••••••••••••••' },
    SASRA: { enabled: true, lastSync: new Date().toISOString(), apiKey: '••••••••••••••••' }
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState<string | null>(null);
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrationStats();
  }, []);

  const loadIntegrationStats = async () => {
    try {
      const [iprsRes, paymentRes, kraRes, sasraRes] = await Promise.all([
        supabase.from('iprs_verifications').select('*', { count: 'exact', head: true }),
        supabase.from('payment_transactions').select('*', { count: 'exact' }),
        supabase.from('kra_verifications').select('*', { count: 'exact', head: true }),
        supabase.from('sasra_verifications').select('*', { count: 'exact', head: true })
      ]);

      const totalRevenue = paymentRes.data
        ?.filter(t => t.payment_status === 'COMPLETED')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;

      setStats({
        iprsVerifications: iprsRes.count || 0,
        paymentTransactions: paymentRes.count || 0,
        kraVerifications: kraRes.count || 0,
        sasraVerifications: sasraRes.count || 0,
        totalRevenue
      });

      const recentPayments = paymentRes.data?.slice(0, 5).map(p => ({
        type: 'PAYMENT',
        description: p.service_type,
        amount: p.amount,
        status: p.payment_status,
        timestamp: p.created_at
      })) || [];

      setRecentActivity(recentPayments);
    } catch (error) {
      console.error('Error loading integration stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (serviceName: string) => {
    setSyncing(serviceName);
    try {
      // Simulate sync operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      setServiceStatuses(prev => ({
        ...prev,
        [serviceName]: {
          ...prev[serviceName],
          lastSync: new Date().toISOString()
        }
      }));
      await loadIntegrationStats();
    } catch (err) {
      console.error('Error syncing:', err);
    } finally {
      setSyncing(null);
    }
  };

  const handleToggleService = (serviceName: string) => {
    setServiceStatuses(prev => ({
      ...prev,
      [serviceName]: {
        ...prev[serviceName],
        enabled: !prev[serviceName].enabled
      }
    }));
  };

  const handleSaveApiKey = (serviceName: string) => {
    if (apiKeyValue.trim()) {
      setServiceStatuses(prev => ({
        ...prev,
        [serviceName]: {
          ...prev[serviceName],
          apiKey: '••••••••••••••••' // Masked for display
        }
      }));
      setShowApiKeyModal(null);
      setApiKeyValue('');
    }
  };

  const integrationServices = [
    {
      name: 'IPRS',
      description: 'Integrated Population Registration System',
      icon: Shield,
      color: 'bg-blue-600',
      status: serviceStatuses.IPRS.enabled ? 'Active' : 'Disabled',
      verifications: stats.iprsVerifications,
      lastSync: serviceStatuses.IPRS.lastSync
    },
    {
      name: 'eCitizen',
      description: 'Payment Gateway',
      icon: CreditCard,
      color: 'bg-green-600',
      status: serviceStatuses.eCitizen.enabled ? 'Active' : 'Disabled',
      verifications: stats.paymentTransactions,
      lastSync: serviceStatuses.eCitizen.lastSync
    },
    {
      name: 'KRA iTax',
      description: 'Tax Compliance Verification',
      icon: FileText,
      color: 'bg-red-600',
      status: serviceStatuses.KRA.enabled ? 'Active' : 'Disabled',
      verifications: stats.kraVerifications,
      lastSync: serviceStatuses.KRA.lastSync
    },
    {
      name: 'SASRA',
      description: 'SACCO Regulatory Authority',
      icon: Building2,
      color: 'bg-purple-600',
      status: serviceStatuses.SASRA.enabled ? 'Active' : 'Disabled',
      verifications: stats.sasraVerifications,
      lastSync: serviceStatuses.SASRA.lastSync
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading integration statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integration Services</h2>
          <p className="text-gray-600 mt-1">Monitor and manage external service integrations</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
          <p className="text-sm font-medium text-yellow-800">Mock Environment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
            <Activity className="h-8 w-8 opacity-50" />
          </div>
          <p className="text-sm opacity-90">Total Revenue</p>
          <p className="text-3xl font-bold mt-1">KES {(stats.totalRevenue / 1000).toFixed(1)}K</p>
          <p className="text-xs opacity-75 mt-2">From eCitizen payments</p>
        </div>

        {integrationServices.map((service, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${service.color} p-3 rounded-lg`}>
                <service.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center space-x-2">
                {service.status === 'Active' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
                <button
                  onClick={() => handleToggleService(service.name)}
                  className={`p-1 rounded ${service.status === 'Active' ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                  title={service.status === 'Active' ? 'Disable' : 'Enable'}
                >
                  {service.status === 'Active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900">{service.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{service.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">{service.verifications}</span>
              <span className="text-xs text-gray-500">verifications</span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  service.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {service.status}
                </span>
                <button
                  onClick={() => handleSync(service.name)}
                  disabled={syncing === service.name || service.status !== 'Active'}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Sync now"
                >
                  <RefreshCw className={`h-4 w-4 ${syncing === service.name ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="text-xs text-gray-500">
                Last sync: {new Date(service.lastSync).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Health Status</h3>
          <div className="space-y-3">
            {integrationServices.map((service, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`${service.color} p-2 rounded-lg`}>
                    <service.icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{service.name}</p>
                    <p className="text-xs text-gray-600">{service.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Last sync: {new Date(service.lastSync).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${service.status === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span className={`text-xs font-medium ${service.status === 'Active' ? 'text-green-700' : 'text-gray-600'}`}>
                      {service.status}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowApiKeyModal(service.name)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Manage API Key"
                  >
                    <Key className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-600 p-2 rounded-lg">
                      <CreditCard className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">KES {activity.amount}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activity.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                      activity.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* API Key Management Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Manage API Key</h3>
                <button
                  onClick={() => {
                    setShowApiKeyModal(null);
                    setApiKeyValue('');
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <span className="text-gray-500">×</span>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">{showApiKeyModal} Integration</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={apiKeyValue}
                  onChange={(e) => setApiKeyValue(e.target.value)}
                  placeholder="Enter API key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: {serviceStatuses[showApiKeyModal]?.apiKey || 'Not set'}
                </p>
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowApiKeyModal(null);
                    setApiKeyValue('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveApiKey(showApiKeyModal)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Shield className="h-6 w-6 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900">Development Environment Notice</h4>
            <p className="text-sm text-blue-800 mt-2">
              These are <strong>mock integrations</strong> for development and testing purposes. 
              They simulate the behavior of real government and financial service APIs with realistic 
              data and workflows.
            </p>
            <p className="text-sm text-blue-800 mt-2">
              <strong>Production deployment</strong> will require:
            </p>
            <ul className="text-sm text-blue-800 mt-2 ml-4 list-disc space-y-1">
              <li>Official API credentials from each service provider</li>
              <li>Government contracts and data sharing agreements</li>
              <li>Security audits and compliance certifications</li>
              <li>Production endpoint configuration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
