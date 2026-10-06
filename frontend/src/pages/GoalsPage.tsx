import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { Chip } from '../components/ui/Chip';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useToast } from '../hooks/useToast';
import { goalsApi } from '../api/endpoints';
import type { Goal } from '../api/types';
import { Target, Plus, TrendingUp, Trophy, Calendar, ChevronRight } from 'lucide-react';

const CATEGORIES = ['fitness', 'health', 'school', 'money', 'personal', 'productivity', 'learning', 'other'];

const fmtValue = (g: Goal): string => {
  const cur = g.current_value ?? 0;
  const target = g.target_value;
  if (!target) return `${cur}`;
  if (g.unit === 'USD') return `$${cur} / $${target}`;
  if (g.unit) return `${cur} / ${target} ${g.unit}`;
  return `${cur} / ${target}`;
};

export const GoalsPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('fitness');
  const [targetValue, setTargetValue] = useState<number | ''>('');
  const [unit, setUnit] = useState('');
  const [deadline, setDeadline] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setGoals(await goalsApi.list());
    } catch {
      showToast('Could not load goals', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const createGoal = async () => {
    if (!name.trim()) {
      showToast('Give your goal a name', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const g = await goalsApi.create({
        name: name.trim(),
        category,
        target_value: typeof targetValue === 'number' && targetValue > 0 ? targetValue : null,
        unit: unit.trim() || null,
        deadline: deadline || null,
        current_value: 0,
      });
      showToast('Goal created — one step at a time', 'success');
      setIsModalOpen(false);
      setName('');
      setTargetValue('');
      setUnit('');
      setDeadline('');
      navigate(`/goals/${g.id}`);
    } catch {
      showToast('Could not create goal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const quickProgress = async (goal: Goal, delta: number) => {
    try {
      const updated = await goalsApi.updateProgress(goal.id, delta);
      showToast(
        updated.status === 'completed'
          ? `Goal complete: "${goal.name}" — you made it.`
          : `+${delta} logged on "${goal.name}"`,
        'success'
      );
      await load();
    } catch {
      showToast('Could not update progress', 'error');
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Goals" subtitle="Where you're headed" icon={Target} />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const active = goals.filter((g) => g.status === 'active');
  const done = goals.filter((g) => g.status !== 'active');

  return (
    <div>
      <PageHeader
        title="Goals"
        subtitle="Where you're headed"
        icon={Target}
        action={
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> New goal
          </Button>
        }
      />

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Big or small — 'Save $500', 'Do 10 pull-ups', 'Study 30 minutes a day'. Your AI coach can help you break it down."
        />
      ) : (
        <div className="space-y-3 mb-8">
          {active.map((g) => {
            const pct =
              g.target_value && g.target_value > 0
                ? Math.min(100, Math.round(((g.current_value ?? 0) / g.target_value) * 100))
                : 0;
            return (
              <Card
                key={g.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/goals/${g.id}`)}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold">{g.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Chip>{g.category}</Chip>
                      {g.deadline && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(g.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0 mt-1" />
                </div>
                <ProgressBar value={pct} />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{fmtValue(g)}</p>
                  <p className="text-sm font-semibold">{pct}%</p>
                </div>
                {g.target_value && g.target_value > 0 && (
                  <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => quickProgress(g, Math.max(1, Math.round(g.target_value! * 0.05)))}
                    >
                      <TrendingUp className="w-3.5 h-3.5" /> Quick log
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => quickProgress(g, g.target_value!)}
                    >
                      Complete
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {done.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" /> Completed
          </h3>
          <div className="space-y-3">
            {done.map((g) => (
              <Card
                key={g.id}
                className="flex items-center justify-between cursor-pointer"
                onClick={() => navigate(`/goals/${g.id}`)}
              >
                <div>
                  <p className="font-medium line-through decoration-slate-300">{g.name}</p>
                  <p className="text-xs text-slate-400">{fmtValue(g)}</p>
                </div>
                <Trophy className="w-5 h-5 text-amber-400" />
              </Card>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New goal">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">Goal name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Save $500, Do 10 pull-ups, Read 10 books..."
              onKeyDown={(e) => e.key === 'Enter' && createGoal()}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400">Category</label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={CATEGORIES.map((c) => ({
                  value: c,
                  label: c.charAt(0).toUpperCase() + c.slice(1),
                }))}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400">Unit (optional)</label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="USD, reps, days..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400">Target (optional)</label>
              <Input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="500"
                min={0}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400">Deadline (optional)</label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Measurable goals get progress bars. You can always add milestones later.
          </p>
          <Button onClick={createGoal} disabled={submitting} className="w-full">
            {submitting ? 'Creating...' : 'Create goal'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default GoalsPage;
