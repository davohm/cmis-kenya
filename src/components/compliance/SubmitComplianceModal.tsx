import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SubmitComplianceModalProps {
  cooperativeId?: string;
  cooperatives: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubmitComplianceModal({ cooperativeId, cooperatives, onClose, onSuccess }: SubmitComplianceModalProps) {
  const [formData, setFormData] = useState({
    cooperative_id: cooperativeId || '',
    financial_year: new Date().getFullYear(),
    agm_held: false,
    agm_date: '',
    bylaws_compliant: false,
    meetings_compliant: false,
    records_compliant: false,
    financial_compliant: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const [agmMinutesUrl, setAgmMinutesUrl] = useState('');
  const [financialStatementUrl, setFinancialStatementUrl] = useState('');
  const [auditReportUrl, setAuditReportUrl] = useState('');
  const [annualReturnUrl, setAnnualReturnUrl] = useState('');

  const handleFileUpload = async (file: File, setter: (path: string) => void) => {
    setUploading(true);
    try {
      const timestamp = Date.now();
      const fileName = `compliance/${timestamp}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('registration-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Store the file path, not the signed URL
      setter(fileName);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.cooperative_id || !formData.financial_year) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Calculate compliance score
      const checks = [
        formData.bylaws_compliant,
        formData.meetings_compliant,
        formData.records_compliant,
        formData.financial_compliant
      ];
      const score = (checks.filter(Boolean).length / checks.length) * 100;

      // Determine status
      let status = 'PENDING_REVIEW';
      if (score === 100) status = 'COMPLIANT';
      else if (score >= 75) status = 'PARTIALLY_COMPLIANT';
      else if (score < 75) status = 'NON_COMPLIANT';

      // Generate report number
      const reportNumber = `CR-${formData.financial_year}-${Date.now().toString().slice(-6)}`;

      // Insert compliance report
      const { error: insertError } = await supabase
        .from('compliance_reports')
        .insert({
          report_number: reportNumber,
          cooperative_id: formData.cooperative_id,
          financial_year: formData.financial_year,
          agm_held: formData.agm_held,
          agm_date: formData.agm_date || null,
          agm_minutes_url: agmMinutesUrl || null,
          financial_statement_url: financialStatementUrl || null,
          audit_report_url: auditReportUrl || null,
          annual_return_url: annualReturnUrl || null,
          bylaws_compliant: formData.bylaws_compliant,
          meetings_compliant: formData.meetings_compliant,
          records_compliant: formData.records_compliant,
          financial_compliant: formData.financial_compliant,
          status: status,
          compliance_score: Math.round(score),
          submitted_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      onSuccess();
    } catch (err: any) {
      console.error('Error submitting compliance report:', err);
      setError(err.message || 'Failed to submit compliance report');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Submit Compliance Report</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Cooperative Selection */}
          {!cooperativeId && cooperatives.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cooperative <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.cooperative_id}
                onChange={(e) => setFormData({ ...formData, cooperative_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              >
                <option value="">Select a cooperative</option>
                {cooperatives.map((coop) => (
                  <option key={coop.id} value={coop.id}>{coop.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Financial Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Financial Year <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.financial_year}
              onChange={(e) => setFormData({ ...formData, financial_year: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              min="2000"
              max={new Date().getFullYear()}
              required
            />
          </div>

          {/* AGM Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Annual General Meeting</h4>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.agm_held}
                onChange={(e) => setFormData({ ...formData, agm_held: e.target.checked })}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <label className="text-sm font-medium text-gray-700">AGM was held</label>
            </div>
            {formData.agm_held && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AGM Date</label>
                  <input
                    type="date"
                    value={formData.agm_date}
                    onChange={(e) => setFormData({ ...formData, agm_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AGM Minutes</label>
                  <input
                    type="file"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setAgmMinutesUrl)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    accept=".pdf,.doc,.docx"
                    disabled={uploading}
                  />
                  {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                  {agmMinutesUrl && <p className="text-sm text-green-600 mt-1">✓ Uploaded</p>}
                </div>
              </>
            )}
          </div>

          {/* Compliance Checks */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Compliance Checks</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.bylaws_compliant}
                  onChange={(e) => setFormData({ ...formData, bylaws_compliant: e.target.checked })}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700">Bylaws Compliance</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.meetings_compliant}
                  onChange={(e) => setFormData({ ...formData, meetings_compliant: e.target.checked })}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700">Meetings Compliance</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.records_compliant}
                  onChange={(e) => setFormData({ ...formData, records_compliant: e.target.checked })}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700">Records Compliance</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.financial_compliant}
                  onChange={(e) => setFormData({ ...formData, financial_compliant: e.target.checked })}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700">Financial Compliance</span>
              </label>
            </div>
          </div>

          {/* Supporting Documents */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Supporting Documents</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Financial Statement</label>
              <input
                type="file"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setFinancialStatementUrl)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                accept=".pdf,.xls,.xlsx"
                disabled={uploading}
              />
              {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
              {financialStatementUrl && <p className="text-sm text-green-600 mt-1">✓ Uploaded</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audit Report</label>
              <input
                type="file"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setAuditReportUrl)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                accept=".pdf"
                disabled={uploading}
              />
              {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
              {auditReportUrl && <p className="text-sm text-green-600 mt-1">✓ Uploaded</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Annual Return</label>
              <input
                type="file"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setAnnualReturnUrl)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                accept=".pdf"
                disabled={uploading}
              />
              {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
              {annualReturnUrl && <p className="text-sm text-green-600 mt-1">✓ Uploaded</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading || uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              disabled={loading || uploading}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
