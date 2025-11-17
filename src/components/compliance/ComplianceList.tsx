import { useState, useEffect } from 'react';
import { Search, Plus, Award, FileText, AlertTriangle, CheckCircle, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import SubmitComplianceModal from './SubmitComplianceModal';

interface ComplianceReport {
  id: string;
  report_number: string;
  cooperative_id: string;
  financial_year: number;
  agm_held: boolean;
  agm_date: string | null;
  status: string;
  compliance_score: number | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  cooperatives: {
    name: string;
    registration_number: string;
  };
}

interface ComplianceListProps {
  role: string;
  tenantId?: string;
  cooperativeId?: string;
  onSelectReport: (reportId: string) => void;
}

export default function ComplianceList({ role, tenantId, cooperativeId, onSelectReport }: ComplianceListProps) {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<ComplianceReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cooperatives, setCooperatives] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadReports();
    if (role === 'SUPER_ADMIN' || role === 'COUNTY_ADMIN') {
      loadCooperatives();
    }
  }, [role, tenantId, cooperativeId]);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm, statusFilter, yearFilter]);

  const loadCooperatives = async () => {
    let query = supabase
      .from('cooperatives')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (role === 'COUNTY_ADMIN' && tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data } = await query;
    setCooperatives(data || []);
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('compliance_reports')
        .select(`
          *,
          cooperatives (
            name,
            registration_number,
            tenant_id
          )
        `)
        .order('financial_year', { ascending: false });

      if (cooperativeId) {
        query = query.eq('cooperative_id', cooperativeId);
      } else if (role === 'COUNTY_ADMIN' && tenantId) {
        const { data: coopIds } = await supabase
          .from('cooperatives')
          .select('id')
          .eq('tenant_id', tenantId);
        
        if (coopIds && coopIds.length > 0) {
          query = query.in('cooperative_id', coopIds.map(c => c.id));
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading compliance reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];

    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.report_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.cooperatives.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }

    if (yearFilter) {
      filtered = filtered.filter((report) => report.financial_year === yearFilter);
    }

    setFilteredReports(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return 'bg-green-100 text-green-800';
      case 'NON_COMPLIANT':
        return 'bg-red-100 text-red-800';
      case 'PARTIALLY_COMPLIANT':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'NON_COMPLIANT':
      case 'OVERDUE':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const exportToCSV = () => {
    const headers = ['Report Number', 'Cooperative', 'Financial Year', 'Status', 'Score', 'AGM Held', 'Submitted Date'];
    const rows = filteredReports.map(r => [
      r.report_number,
      r.cooperatives.name,
      r.financial_year,
      r.status,
      r.compliance_score || 'N/A',
      r.agm_held ? 'Yes' : 'No',
      r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance_reports_${yearFilter}.csv`;
    a.click();
  };

  const canSubmit = role === 'COOPERATIVE_ADMIN' || role === 'SUPER_ADMIN' || role === 'COUNTY_ADMIN';

  const compliantCount = filteredReports.filter(r => r.status === 'COMPLIANT').length;
  const nonCompliantCount = filteredReports.filter(r => r.status === 'NON_COMPLIANT').length;
  const pendingCount = filteredReports.filter(r => r.status === 'PENDING_REVIEW').length;
  const avgScore = filteredReports.length > 0 
    ? Math.round(filteredReports.reduce((sum, r) => sum + (r.compliance_score || 0), 0) / filteredReports.length)
    : 0;

  const years = Array.from(new Set(reports.map(r => r.financial_year))).sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading compliance reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Compliance & Annual Returns</h2>
          <p className="text-gray-600 mt-1">
            {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-5 w-5" />
            Export CSV
          </button>
          {canSubmit && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Submit Report
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-10 w-10 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{compliantCount}</p>
              <p className="text-sm text-gray-600">Compliant</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-10 w-10 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{nonCompliantCount}</p>
              <p className="text-sm text-gray-600">Non-Compliant</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-10 w-10 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-600">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Award className="h-10 w-10 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{avgScore}%</p>
              <p className="text-sm text-gray-600">Average Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by report number or cooperative..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="COMPLIANT">Compliant</option>
            <option value="NON_COMPLIANT">Non-Compliant</option>
            <option value="PARTIALLY_COMPLIANT">Partially Compliant</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="OVERDUE">Overdue</option>
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cooperative</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AGM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No compliance reports found
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    onClick={() => onSelectReport(report.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(report.status)}
                        <div>
                          <p className="font-semibold text-gray-900">{report.report_number}</p>
                          <p className="text-sm text-gray-600">
                            {report.submitted_at ? new Date(report.submitted_at).toLocaleDateString() : 'Not submitted'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{report.cooperatives.name}</p>
                        <p className="text-sm text-gray-600">{report.cooperatives.registration_number}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {report.financial_year}
                    </td>
                    <td className="px-6 py-4">
                      {report.agm_held ? (
                        <div>
                          <p className="text-green-600 font-medium">Held</p>
                          <p className="text-sm text-gray-600">
                            {report.agm_date ? new Date(report.agm_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-red-600 font-medium">Not Held</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {report.compliance_score !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div
                              className={`h-2 rounded-full ${
                                report.compliance_score >= 80 ? 'bg-green-500' :
                                report.compliance_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${report.compliance_score}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-gray-900">{report.compliance_score}%</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                        {report.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showSubmitModal && (
        <SubmitComplianceModal
          cooperativeId={cooperativeId}
          cooperatives={cooperatives}
          onClose={() => setShowSubmitModal(false)}
          onSuccess={() => {
            setShowSubmitModal(false);
            loadReports();
          }}
        />
      )}
    </div>
  );
}
