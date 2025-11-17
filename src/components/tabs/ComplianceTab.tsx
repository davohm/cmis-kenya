import { useState } from 'react';
import ComplianceList from '../compliance/ComplianceList';
import ComplianceDetail from '../compliance/ComplianceDetail';

interface ComplianceTabProps {
  role: string;
  tenantId?: string;
  cooperativeId?: string;
}

export default function ComplianceTab({ role, tenantId, cooperativeId }: ComplianceTabProps) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const handleSelectReport = (reportId: string) => {
    setSelectedReportId(reportId);
  };

  const handleBack = () => {
    setSelectedReportId(null);
  };

  if (selectedReportId) {
    return (
      <ComplianceDetail
        reportId={selectedReportId}
        onBack={handleBack}
        role={role}
      />
    );
  }

  return (
    <ComplianceList
      role={role}
      tenantId={tenantId}
      cooperativeId={cooperativeId}
      onSelectReport={handleSelectReport}
    />
  );
}
