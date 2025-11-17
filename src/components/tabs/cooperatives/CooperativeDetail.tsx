import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Users, DollarSign, Award, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { fetchCooperativeById } from '../../../hooks/useCooperatives';
import { supabase } from '../../../lib/supabase';
import type { Cooperative } from '../../../hooks/useCooperatives';

interface CooperativeDetailProps {
  cooperativeId: string;
  onBack: (() => void) | undefined;
}

export default function CooperativeDetail({ cooperativeId, onBack }: CooperativeDetailProps) {
  const [cooperative, setCooperative] = useState<Cooperative | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(0);
  const [officialsCount, setOfficialsCount] = useState(0);
  const [complianceScore, setComplianceScore] = useState<number | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadCooperativeDetails();
  }, [cooperativeId]);

  const loadCooperativeDetails = async () => {
    setLoading(true);
    
    const coopData = await fetchCooperativeById(cooperativeId);
    setCooperative(coopData);

    if (coopData) {
      const { count: membersCount } = await supabase
        .from('cooperative_members')
        .select('*', { count: 'exact' })
        .eq('cooperative_id', cooperativeId)
        .eq('is_active', true);

      const { count: officialsCountData } = await supabase
        .from('cooperative_officials')
        .select('*', { count: 'exact' })
        .eq('cooperative_id', cooperativeId)
        .eq('is_active', true);

      const { data: complianceData } = await supabase
        .from('compliance_reports')
        .select('compliance_score')
        .eq('cooperative_id', cooperativeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: recentMembers } = await supabase
        .from('cooperative_members')
        .select('*, users(full_name)')
        .eq('cooperative_id', cooperativeId)
        .order('created_at', { ascending: false })
        .limit(5);

      setMemberCount(membersCount || 0);
      setOfficialsCount(officialsCountData || 0);
      setComplianceScore(complianceData?.compliance_score || null);
      
      const activity = recentMembers?.map(member => ({
        type: 'member',
        name: (member.users as any)?.full_name || 'Unknown',
        action: 'Joined as member',
        date: new Date(member.created_at).toLocaleDateString()
      })) || [];
      
      setRecentActivity(activity);
    }

    setLoading(false);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'REGISTERED': return 'bg-blue-100 text-blue-700';
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'SUSPENDED': return 'bg-red-100 text-red-700';
      case 'INACTIVE': return 'bg-gray-100 text-gray-700';
      case 'PENDING_REGISTRATION': return 'bg-yellow-100 text-yellow-700';
      case 'UNDER_LIQUIDATION': return 'bg-orange-100 text-orange-700';
      case 'DISSOLVED': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading cooperative details...</div>
      </div>
    );
  }

  if (!cooperative) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Cooperative not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to List
        </button>
      )}

      <div className="bg-gradient-to-r from-red-600 via-gray-900 to-green-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">{cooperative.name}</h2>
            <p className="text-gray-100 mb-3">Registration No: {cooperative.registration_number || 'N/A'}</p>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(cooperative.status)}`}>
                {formatStatus(cooperative.status)}
              </span>
              <span className="text-sm text-gray-200">
                {cooperative.cooperative_types?.name || 'N/A'}
              </span>
            </div>
          </div>
          <Building2 className="h-16 w-16 text-white opacity-30" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-green-700 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{memberCount.toLocaleString()}</p>
          <p className="text-sm font-medium text-gray-700 mb-2">Active Members</p>
          <p className="text-xs text-gray-500">Current membership</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-red-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">KES {(cooperative.total_share_capital / 1000000).toFixed(1)}M</p>
          <p className="text-sm font-medium text-gray-700 mb-2">Share Capital</p>
          <p className="text-xs text-gray-500">Total value</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gray-800 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{officialsCount}</p>
          <p className="text-sm font-medium text-gray-700 mb-2">Officials</p>
          <p className="text-xs text-gray-500">Elected leaders</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-green-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Award className="h-6 w-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{complianceScore !== null ? `${complianceScore}%` : 'N/A'}</p>
          <p className="text-sm font-medium text-gray-700 mb-2">Compliance Score</p>
          <p className="text-xs text-gray-500">Latest assessment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-red-600" />
            Basic Information
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Registration Number</p>
              <p className="font-medium text-gray-900">{cooperative.registration_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-medium text-gray-900">{cooperative.cooperative_types?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <p className="font-medium text-gray-900">{cooperative.cooperative_types?.category || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">County</p>
              <p className="font-medium text-gray-900">{cooperative.tenants?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Registration Date</p>
              <p className="font-medium text-gray-900">
                {cooperative.registration_date ? new Date(cooperative.registration_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Mail className="h-5 w-5 mr-2 text-red-600" />
            Contact Details
          </h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Physical Address</p>
                <p className="font-medium text-gray-900">{cooperative.address || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Postal Address</p>
                <p className="font-medium text-gray-900">{cooperative.postal_address || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{cooperative.email || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-900">{cooperative.phone || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-red-600" />
            Recent Activity
          </h3>
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{activity.name}</p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                  </div>
                  <span className="text-sm text-gray-500 flex-shrink-0">{activity.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
