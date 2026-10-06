import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Activity } from 'lucide-react';

export const TrackHub: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tracking Hub"
        description="Central command for fitness, nutrition, sleep, and daily habits."
      />
      <EmptyState
        icon={Activity}
        title="This section is coming online"
        description="Full fitness, nutrition, sleep, and habit logging modules will be accessible right here."
      />
    </div>
  );
};
