import React, { useState } from 'react';
import VoiceLogUploader from '@/components/VoiceLogUploader';
import PendingVoiceLogsList from '@/components/PendingVoiceLogsList';

const VoiceLogsPage: React.FC = () => {
  // State to trigger refresh of PendingVoiceLogsList
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  const handleUploadSuccess = () => {
    setRefreshCounter(prev => prev + 1); // Increment to change the key prop
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Voice Log Management</h1>
        <p className="text-muted-foreground">
          Upload new voice logs and review those pending confirmation.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-1">
          <VoiceLogUploader onUploadSuccess={handleUploadSuccess} />
        </div>
        <div className="md:col-span-2">
          {/* Pass refreshCounter as a key to force re-render and re-fetch of PendingVoiceLogsList */}
          <PendingVoiceLogsList key={refreshCounter} refreshKey={refreshCounter} />
        </div>
      </div>
    </div>
  );
};

export default VoiceLogsPage;
