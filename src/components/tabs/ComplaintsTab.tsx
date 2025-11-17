import { useState } from 'react';
import ComplaintsList from '../complaints/ComplaintsList';
import ComplaintDetail from '../complaints/ComplaintDetail';
import SubmitComplaintModal from '../complaints/SubmitComplaintModal';
import { Complaint } from '../../hooks/useComplaints';

interface ComplaintsTabProps {
  role: string;
  tenantId?: string;
  cooperativeId?: string;
}

export default function ComplaintsTab({ role, tenantId, cooperativeId }: ComplaintsTabProps) {
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const handleSelectComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
  };

  const handleBack = () => {
    setSelectedComplaint(null);
  };

  const handleSubmitSuccess = () => {
    setShowSubmitModal(false);
    // The list will auto-refresh due to the refetch in the hook
  };

  if (selectedComplaint) {
    return (
      <ComplaintDetail
        complaint={selectedComplaint}
        onBack={handleBack}
        role={role}
      />
    );
  }

  return (
    <>
      <ComplaintsList
        role={role}
        tenantId={tenantId}
        cooperativeId={cooperativeId}
        onSelectComplaint={handleSelectComplaint}
        onSubmitNew={() => setShowSubmitModal(true)}
      />

      {showSubmitModal && (
        <SubmitComplaintModal
          cooperativeId={cooperativeId}
          onClose={() => setShowSubmitModal(false)}
          onSuccess={handleSubmitSuccess}
        />
      )}
    </>
  );
}
