import { useState } from 'react';
import MembersList from '../members/MembersList';
import MemberDetail from '../members/MemberDetail';

interface MembersTabProps {
  role: string;
  tenantId?: string;
  cooperativeId?: string;
}

export default function MembersTab({ role, tenantId, cooperativeId }: MembersTabProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
  };

  const handleBack = () => {
    setSelectedMemberId(null);
  };

  if (selectedMemberId) {
    return (
      <MemberDetail
        memberId={selectedMemberId}
        onBack={handleBack}
        role={role}
      />
    );
  }

  return (
    <MembersList
      role={role}
      tenantId={tenantId}
      cooperativeId={cooperativeId}
      onSelectMember={handleSelectMember}
    />
  );
}
