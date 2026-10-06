import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { StatTile } from '../components/ui/StatTile';
import { useToast } from '../hooks/useToast';
import { habitsApi } from '../api/endpoints';
import type { Habit, HabitProgress } from '../api/types';
import { CheckCircle2, Circle, Plus, Flame, CalendarCheck, Target, Trash2 } from 'lucide-react';

export const TrackHabits: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [progress, setProgress] = useState<HabitProgress | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [targetPerWeek, setTargetPerWeek] = useState(7);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, prog] = await Promise.all([
        habitsApi.list(),
        habitsApi.getProgress().catch(() => null),
      ]);
      setHabits(list);
      setProgress(prog);
    } catch {
      showToast('Could not load habits', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleToday = async (habit: Habit) => {
    setBusyId(habit.id);
    try {
      if (habit.done_today) {
        const today = new Date().toISOString().slice(0, 10);
        await habitsApi.removeCompletion(habit.id, today);
        showToast(`Unchecked "${habit.name}" — no stress, just data`, 'info');
      } else {
        await habitsApi.complete(habit.id);
        showToast(`"${habit.name}" done — that counts.`, 'success');
      }
      await load();
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const createHabit = async () => {
    if (!name.trim()) {
      showToast('Give your habit a name', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await habitsApi.create({ name: name.trim(), target_per_week: targetPerWeek });
      showToast('Habit created', 'success');
      setName('');
      setTargetPerWeek(7);
      setIsModalOpen(false);
      await load();
    } catch {
      showToast('Could not create habit', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const removeHabit = async (habit: Habit) => {
    setBusyId(habit.id);
    try {
      await habitsApi.delete(habit.id);
      showToast(`Removed "${habit.name}"`, 'info');
      await load();
    } catch {
      showToast('Could not remove habit', 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Habits" subtitle="Consistency over perfection" icon={CalendarCheck} />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Habits"
        subtitle="Consistency over perfection"
        icon={CalendarCheck}
        action={
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> New habit
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatTile title="Done today" value={`${progress?.done_today ?? 0}/${progress?.total ?? 0}`} icon={CheckCircle2} />
        <StatTile title="Today" value={`${progress?.completion_pct ?? 0}%`} icon={Target} />
        <StatTile
          title="Best streak"
          value={habits.reduce((best, h) => Math.max(best, h.streak), 0)}
          icon={Flame}
        />
      </div>

      {habits.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No habits yet"
          description="Start with one small habit. Showing up matters more than being perfect."
        />
      ) : (
        <div className="space-y-3">
          {habits.map((h) => (
            <Card key={h.id} className="flex items-center gap-4">
              <button
                onClick={() => toggleToday(h)}
                disabled={busyId === h.id}
                className="shrink-0 transition-transform active:scale-90 disabled:opacity-50"
                aria-label={h.done_today ? `Mark ${h.name} not done` : `Complete ${h.name}`}
              >
                {h.done_today ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                ) : (
                  <Circle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{h.name}</p>
                  {h.streak > 1 && (
                    <span className="flex items-center gap-0.5 text-xs text-amber-500 font-medium">
                      <Flame className="w-3.5 h-3.5" /> {h.streak}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {h.week_done}/{h.target_per_week} this week
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${Math.min(h.week_pct, 100)}%` }}
                  />
                </div>
              </div>
              <button
                onClick={() => removeHabit(h)}
                disabled={busyId === h.id}
                className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-colors"
                aria-label={`Delete ${h.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
          <p className="text-xs text-slate-400 text-center pt-2">
            Missed a day? No problem — streaks are just a snapshot, never a scorecard.
          </p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New habit">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">Habit name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Read 10 minutes, stretch, drink water..."
              onKeyDown={(e) => e.key === 'Enter' && createHabit()}
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">
              Target per week: {targetPerWeek}
            </label>
            <input
              type="range"
              min={1}
              max={7}
              value={targetPerWeek}
              onChange={(e) => setTargetPerWeek(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
          <Button onClick={createHabit} disabled={submitting} className="w-full">
            {submitting ? 'Creating...' : 'Create habit'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default TrackHabits;
