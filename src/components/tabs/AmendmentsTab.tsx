import { useState } from 'react';
import AmendmentsList from '../amendments/AmendmentsList';
import AmendmentDetail from '../amendments/AmendmentDetail';
import SubmitAmendmentModal from '../amendments/SubmitAmendmentModal';
import { AmendmentRequest, useAmendmentRequests } from '../../hooks/useAmendmentRequests';
import { useAuth } from '../../contexts/AuthContext';

interface AmendmentsTabProps {
  role: string;
  tenantId?: string;
  cooperativeId?: string;
}

export default function AmendmentsTab({ role, tenantId, cooperativeId }: AmendmentsTabProps) {
  const { profile } = useAuth();
  const [selectedAmendment, setSelectedAmendment] = useState<AmendmentRequest | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const { approveAmendment, rejectAmendment, refetch } = useAmendmentRequests(
    role,
    tenantId,
    cooperativeId,
    {},
    1,
    10
  );

  const handleSelectAmendment = (amendment: AmendmentRequest) => {
    setSelectedAmendment(amendment);
  };

  const handleBack = () => {
    setSelectedAmendment(null);
    refetch();
  };

  const handleApprove = async (amendmentId: string, reviewNotes: string) => {
    if (!profile?.id) return;
    const result = await approveAmendment(amendmentId, profile.id, reviewNotes);
    if (result.success) {
      handleBack();
    }
  };

  const handleReject = async (amendmentId: string, reviewNotes: string) => {
    if (!profile?.id) return;
    const result = await rejectAmendment(amendmentId, profile.id, reviewNotes);
    if (result.success) {
      handleBack();
    }
  };

  const handleSubmitSuccess = () => {
    setShowSubmitModal(false);
    refetch();
  };

  if (selectedAmendment) {
    return (
      <AmendmentDetail
        amendment={selectedAmendment}
        onBack={handleBack}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    );
  }

  return (
    <>
      <AmendmentsList
        role={role}
        tenantId={tenantId}
        cooperativeId={cooperativeId}
        onSelectAmendment={handleSelectAmendment}
        onSubmitNew={() => setShowSubmitModal(true)}
      />

      {showSubmitModal && (
        <SubmitAmendmentModal
          cooperativeId={cooperativeId}
          onClose={() => setShowSubmitModal(false)}
          onSuccess={handleSubmitSuccess}
        />
      )}
    </>
  );
}
