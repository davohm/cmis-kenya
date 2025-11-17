import { useState } from 'react';
import ApplicationsList from './applications/ApplicationsList';
import ApplicationDetail from './applications/ApplicationDetail';
import type { Application } from '../../hooks/useApplications';

interface ApplicationsTabProps {
  role: string;
  tenantId: string | undefined;
}

export default function ApplicationsTab({ role, tenantId }: ApplicationsTabProps) {
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const handleSelectApplication = (application: Application) => {
    setSelectedApplication(application);
  };

  const handleBack = () => {
    setSelectedApplication(null);
  };

  const handleActionComplete = () => {
    setSelectedApplication(null);
  };

  if (selectedApplication) {
    return (
      <ApplicationDetail
        application={selectedApplication}
        onBack={handleBack}
        onActionComplete={handleActionComplete}
      />
    );
  }

  return (
    <ApplicationsList
      role={role}
      tenantId={tenantId}
      onSelectApplication={handleSelectApplication}
    />
  );
}
