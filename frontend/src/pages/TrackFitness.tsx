import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Dumbbell } from 'lucide-react';

export const TrackFitness: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Fitness & Workouts"
        description="Log workouts, track sets & reps, generate AI workout plans, and view PR charts."
      />
      <EmptyState
        icon={Dumbbell}
        title="This section is coming online"
        description="Workout logger, exercise library, AI generator, and recharts progress visuals will be active here."
      />
    </div>
  );
};
