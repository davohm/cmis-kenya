import { Settings, Save, Bell, Mail, Database, Shield, Globe, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface SystemSettings {
  // General Settings
  site_name: string;
  site_description: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  
  // Email Settings
  email_enabled: boolean;
  email_from_address: string;
  email_from_name: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  
  // Notification Settings
  notifications_enabled: boolean;
  notification_email_enabled: boolean;
  notification_sms_enabled: boolean;
  
  // Security Settings
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_numbers: boolean;
  password_require_symbols: boolean;
  session_timeout_minutes: number;
  max_login_attempts: number;
  
  // Data Retention
  audit_log_retention_days: number;
  document_retention_days: number;
  inactive_user_retention_days: number;
}

export default function SystemSettingsTab() {
  const [settings, setSettings] = useState<SystemSettings>({
    site_name: 'CMIS Kenya',
    site_description: 'Cooperative Management Information System',
    maintenance_mode: false,
    maintenance_message: 'System is under maintenance. Please check back later.',
    email_enabled: true,
    email_from_address: 'noreply@cmis.go.ke',
    email_from_name: 'CMIS Kenya',
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    notifications_enabled: true,
    notification_email_enabled: true,
    notification_sms_enabled: false,
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_numbers: true,
    password_require_symbols: true,
    session_timeout_minutes: 60,
    max_login_attempts: 5,
    audit_log_retention_days: 365,
    document_retention_days: 2555, // 7 years
    inactive_user_retention_days: 730, // 2 years
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeSection, setActiveSection] = useState('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would load from a settings table
      // For now, we'll use default values
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);
      
      // In a real implementation, this would save to a settings table
      // For now, we'll just simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-600 mt-1">Configure system-wide settings and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-lg ${
          saveMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {saveMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
            <button
              onClick={() => setActiveSection('general')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'general' ? 'bg-red-50 text-red-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Settings className="h-4 w-4 inline mr-2" />
              General
            </button>
            <button
              onClick={() => setActiveSection('email')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'email' ? 'bg-red-50 text-red-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Mail className="h-4 w-4 inline mr-2" />
              Email
            </button>
            <button
              onClick={() => setActiveSection('notifications')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'notifications' ? 'bg-red-50 text-red-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Bell className="h-4 w-4 inline mr-2" />
              Notifications
            </button>
            <button
              onClick={() => setActiveSection('security')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'security' ? 'bg-red-50 text-red-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              Security
            </button>
            <button
              onClick={() => setActiveSection('data')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'data' ? 'bg-red-50 text-red-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Database className="h-4 w-4 inline mr-2" />
              Data Retention
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {activeSection === 'general' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">General Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                    <input
                      type="text"
                      value={settings.site_name}
                      onChange={(e) => handleChange('site_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site Description</label>
                    <textarea
                      value={settings.site_description}
                      onChange={(e) => handleChange('site_description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Maintenance Mode</label>
                      <p className="text-xs text-gray-500">Enable to put the system in maintenance mode</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.maintenance_mode}
                      onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-600"
                    />
                  </div>
                  {settings.maintenance_mode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Message</label>
                      <textarea
                        value={settings.maintenance_message}
                        onChange={(e) => handleChange('maintenance_message', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'email' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Email Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Enable Email</label>
                      <p className="text-xs text-gray-500">Enable email notifications and communications</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.email_enabled}
                      onChange={(e) => handleChange('email_enabled', e.target.checked)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Address</label>
                      <input
                        type="email"
                        value={settings.email_from_address}
                        onChange={(e) => handleChange('email_from_address', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                      <input
                        type="text"
                        value={settings.email_from_name}
                        onChange={(e) => handleChange('email_from_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                      <input
                        type="text"
                        value={settings.smtp_host}
                        onChange={(e) => handleChange('smtp_host', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                      <input
                        type="number"
                        value={settings.smtp_port}
                        onChange={(e) => handleChange('smtp_port', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Username</label>
                      <input
                        type="text"
                        value={settings.smtp_username}
                        onChange={(e) => handleChange('smtp_username', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
                      <input
                        type="password"
                        value={settings.smtp_password}
                        onChange={(e) => handleChange('smtp_password', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Enable Notifications</label>
                      <p className="text-xs text-gray-500">Enable system-wide notifications</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifications_enabled}
                      onChange={(e) => handleChange('notifications_enabled', e.target.checked)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-600"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email Notifications</label>
                      <p className="text-xs text-gray-500">Send notifications via email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notification_email_enabled}
                      onChange={(e) => handleChange('notification_email_enabled', e.target.checked)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-600"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">SMS Notifications</label>
                      <p className="text-xs text-gray-500">Send notifications via SMS</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notification_sms_enabled}
                      onChange={(e) => handleChange('notification_sms_enabled', e.target.checked)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Security Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Password Length</label>
                    <input
                      type="number"
                      value={settings.password_min_length}
                      onChange={(e) => handleChange('password_min_length', parseInt(e.target.value))}
                      min={6}
                      max={32}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <label className="text-sm font-medium text-gray-700">Require Uppercase</label>
                      <input
                        type="checkbox"
                        checked={settings.password_require_uppercase}
                        onChange={(e) => handleChange('password_require_uppercase', e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-600"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <label className="text-sm font-medium text-gray-700">Require Lowercase</label>
                      <input
                        type="checkbox"
                        checked={settings.password_require_lowercase}
                        onChange={(e) => handleChange('password_require_lowercase', e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-600"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <label className="text-sm font-medium text-gray-700">Require Numbers</label>
                      <input
                        type="checkbox"
                        checked={settings.password_require_numbers}
                        onChange={(e) => handleChange('password_require_numbers', e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-600"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <label className="text-sm font-medium text-gray-700">Require Symbols</label>
                      <input
                        type="checkbox"
                        checked={settings.password_require_symbols}
                        onChange={(e) => handleChange('password_require_symbols', e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-600"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
                      <input
                        type="number"
                        value={settings.session_timeout_minutes}
                        onChange={(e) => handleChange('session_timeout_minutes', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Login Attempts</label>
                      <input
                        type="number"
                        value={settings.max_login_attempts}
                        onChange={(e) => handleChange('max_login_attempts', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'data' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Data Retention Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Audit Log Retention (days)</label>
                    <input
                      type="number"
                      value={settings.audit_log_retention_days}
                      onChange={(e) => handleChange('audit_log_retention_days', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">Audit logs older than this will be automatically deleted</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Retention (days)</label>
                    <input
                      type="number"
                      value={settings.document_retention_days}
                      onChange={(e) => handleChange('document_retention_days', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">Documents older than this will be archived</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inactive User Retention (days)</label>
                    <input
                      type="number"
                      value={settings.inactive_user_retention_days}
                      onChange={(e) => handleChange('inactive_user_retention_days', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">Inactive user accounts older than this will be deactivated</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

