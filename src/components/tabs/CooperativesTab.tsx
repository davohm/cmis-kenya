import { useState } from 'react';
import CooperativesList from './cooperatives/CooperativesList';
import CooperativeDetail from './cooperatives/CooperativeDetail';
import type { Cooperative } from '../../hooks/useCooperatives';

interface CooperativesTabProps {
  role: string;
  tenantId: string | undefined;
  cooperativeId?: string | undefined;
}

export default function CooperativesTab({ role, tenantId, cooperativeId }: CooperativesTabProps) {
  const [selectedCooperative, setSelectedCooperative] = useState<Cooperative | null>(null);

  const handleSelectCooperative = (cooperative: Cooperative) => {
    setSelectedCooperative(cooperative);
  };

  const handleBack = () => {
    setSelectedCooperative(null);
  };

  if (role === 'COOPERATIVE_ADMIN' && cooperativeId) {
    return (
      <CooperativeDetail
        cooperativeId={cooperativeId}
        onBack={undefined}
      />
    );
  }

  if (selectedCooperative) {
    return (
      <CooperativeDetail
        cooperativeId={selectedCooperative.id}
        onBack={handleBack}
      />
    );
  }

  return (
    <CooperativesList
      role={role}
      tenantId={tenantId}
      cooperativeId={cooperativeId}
      onSelectCooperative={handleSelectCooperative}
    />
  );
}
