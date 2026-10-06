import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useToast } from '../hooks/useToast';
import { goalsApi } from '../api/endpoints';
import type { Goal, GoalMilestone } from '../api/types';
import { Target, TrendingUp, Trophy, Plus, Check, Trash2, Flag } from 'lucide-react';

const fmt = (g: Goal): string => {
  const cur = g.current_value ?? 0;
  if (g.target_value && g.unit === 'USD') return `$${cur} / $${g.target_value}`;
  if (g.target_value && g.unit) return `${cur} / ${g.target_value} ${g.unit}`;
  return g.target_value ? `${cur} / ${g.target_value}` : `${cur}`;
};

export const GoalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [milestones, setMilestones] = useState<GoalMilestone[]>([]);
  const [delta, setDelta] = useState<number | ''>('');
  const [msName, setMsName] = useState('');
  const [msTarget, setMsTarget] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [g, ms] = await Promise.all([
        goalsApi.get(id),
        goalsApi.listMilestones(id).catch(() => [] as GoalMilestone[]),
      ]);
      setGoal(g);
      setMilestones(ms);
    } catch {
      showToast('Goal not found', 'error');
      navigate('/goals');
    } finally {
      setLoading(false);
    }
  }, [id, showToast, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const addProgress = async () => {
    if (!goal || typeof delta !== 'number' || delta === 0) return;
    try {
      const updated = await goalsApi.updateProgress(goal.id, delta);
      if (updated.status === 'completed') {
        showToast(`Goal unlocked: you started at 0 and made it here.`, 'success');
      } else {
        showToast(`Progress updated: +${delta}`, 'success');
      }
      setDelta('');
      await load();
    } catch {
      showToast('Could not update progress', 'error');
    }
  };

  const addMilestone = async () => {
    if (!goal || !id || !msName.trim()) {
      showToast('Name the milestone first', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await goalsApi.addMilestone(id, {
        name: msName.trim(),
        target_value: typeof msTarget === 'number' ? msTarget : 0,
      });
      showToast('Milestone added', 'success');
      setMsName('');
      setMsTarget('');
      await load();
    } catch {
      showToast('Could not add milestone', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMilestone = async (m: GoalMilestone) => {
    if (!goal || !id) return;
    try {
      await goalsApi.updateMilestone(id, m.id, { completed: !m.completed });
      await load();
    } catch {
      showToast('Could not update milestone', 'error');
    }
  };

  const deleteMilestone = async (m: GoalMilestone) => {
    if (!goal || !id) return;
    try {
      await goalsApi.deleteMilestone(id, m.id);
      await load();
    } catch {
      showToast('Could not delete milestone', 'error');
    }
  };

  if (loading || !goal) {
    return (
      <div>
        <PageHeader title="Goal" backUrl="/goals" icon={Target} />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const pct =
    goal.target_value && goal.target_value > 0
      ? Math.min(100, Math.round(((goal.current_value ?? 0) / goal.target_value) * 100))
      : 0;
  const nextMs = milestones
    .filter((m) => !m.completed && m.target_value && m.target_value > (goal.current_value ?? 0))
    .sort((a, b) => (a.target_value ?? 0) - (b.target_value ?? 0))[0];

  return (
    <div>
      <PageHeader title={goal.name} backUrl="/goals" icon={Target} />

      <Card className="mb-6">
        {goal.target_value ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="text-2xl font-bold">{fmt(goal)}</p>
              <p className="text-sm font-semibold text-indigo-500">{pct}% complete</p>
            </div>
            <ProgressBar value={pct} size="lg" showPercentage={false} />
            <p className="text-xs text-slate-400 mt-2">
              {nextMs
                ? `Next milestone: ${nextMs.name}`
                : 'No upcoming milestone — add one below.'}
            </p>
          </>
        ) : (
          <p className="text-lg">{goal.status === 'completed' ? 'Completed' : 'In progress'}</p>
        )}
        {goal.status === 'completed' && (
          <div className="flex items-center gap-2 text-amber-500 mt-3 font-medium">
            <Trophy className="w-5 h-5" /> You started at 0 and made it here.
          </div>
        )}
      </Card>

      <Card className="mb-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Log progress
        </h3>
        <div className="flex gap-2">
          <Input
            type="number"
            value={delta}
            onChange={(e) => setDelta(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={goal.unit === 'USD' ? 'Amount, e.g. 25' : `Amount, e.g. ${Math.max(1, Math.round((goal.target_value ?? 10) * 0.1))}`}
          />
          <Button onClick={addProgress} disabled={typeof delta !== 'number' || delta === 0}>
            Add
          </Button>
        </div>
        {goal.notes && <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">{goal.notes}</p>}
      </Card>

      <Card>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Flag className="w-4 h-4" /> Milestones
        </h3>
        {milestones.length === 0 ? (
          <p className="text-sm text-slate-400 mb-4">
            Break the big goal into smaller wins. They add up.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 mb-4">
            {milestones.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-3">
                <button
                  onClick={() => toggleMilestone(m)}
                  className={`shrink-0 transition-transform active:scale-90 ${
                    m.completed ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'
                  }`}
                  aria-label={m.completed ? 'Mark incomplete' : 'Complete milestone'}
                >
                  {m.completed ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6 rotate-45" />}
                </button>
                <div className="flex-1">
                  <p className={`text-sm ${m.completed ? 'line-through text-slate-400' : 'font-medium'}`}>
                    {m.name}
                  </p>
                  {m.target_value ? (
                    <p className="text-xs text-slate-400">
                      at {goal.unit === 'USD' ? `$${m.target_value}` : `${m.target_value} ${goal.unit ?? ''}`}
                    </p>
                  ) : null}
                </div>
                <button
                  onClick={() => deleteMilestone(m)}
                  className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-colors"
                  aria-label="Delete milestone"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={msName}
            onChange={(e) => setMsName(e.target.value)}
            placeholder="Milestone name"
          />
          <div className="flex gap-2">
            <Input
              type="number"
              value={msTarget}
              onChange={(e) => setMsTarget(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="At (value)"
              className="sm:w-28"
            />
            <Button onClick={addMilestone} disabled={submitting}>
              {submitting ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>
      </Card>

      <div className="mt-6 text-center">
        <EmptyStateHidden goal={goal} onDeleted={() => navigate('/goals')} showToast={showToast} />
      </div>
    </div>
  );
};

// Small internal helper: delete goal button with confirm
const EmptyStateHidden: React.FC<{
  goal: Goal;
  onDeleted: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}> = ({ goal, onDeleted, showToast }) => {
  const [confirming, setConfirming] = React.useState(false);
  return confirming ? (
    <div className="flex items-center gap-3 justify-center">
      <span className="text-sm text-slate-500">Delete this goal and its milestones?</span>
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          try {
            await goalsApi.delete(goal.id);
            showToast('Goal deleted', 'info');
            onDeleted();
          } catch {
            showToast('Could not delete goal', 'error');
          }
        }}
        className="text-rose-500 border-rose-200 hover:bg-rose-50 dark:border-rose-900"
      >
        Yes, delete
      </Button>
      <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  ) : (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
    >
      Delete goal
    </button>
  );
};

export default GoalDetailPage;
