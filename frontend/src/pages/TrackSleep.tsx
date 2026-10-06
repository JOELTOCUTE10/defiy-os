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
import { sleepApi } from '../api/endpoints';
import type { SleepTrends } from '../api/types';
import { Moon, Plus, Info, Clock, Battery, BatteryCharging } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const fmtHours = (minutes?: number | null): string => {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

export const TrackSleep: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState<SleepTrends | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bedtime, setBedtime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [totalMinutes, setTotalMinutes] = useState(450);
  const [quality, setQuality] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [soreness, setSoreness] = useState(2);
  const [fatigue, setFatigue] = useState(2);
  const [notes, setNotes] = useState('');

  const loadTrends = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sleepApi.getTrends();
      setTrends(data);
    } catch {
      showToast('Could not load sleep data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  const submit = async () => {
    if (!totalMinutes || totalMinutes <= 0) {
      showToast('Enter how long you slept', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await sleepApi.createEntry({
        bedtime: bedtime || undefined,
        wake_time: wakeTime || undefined,
        total_minutes: totalMinutes,
        quality,
        energy,
        soreness,
        fatigue,
        notes: notes || undefined,
      });
      showToast('Sleep logged — nice', 'success');
      setIsModalOpen(false);
      setBedtime('');
      setWakeTime('');
      setTotalMinutes(450);
      setNotes('');
      await loadTrends();
    } catch {
      showToast('Could not save that entry', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Sleep & Recovery" subtitle="Rest is where progress happens" icon={Moon} />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  const chartData = (trends?.trend ?? []).map((p) => ({
    date: p.date.slice(5),
    minutes: p.minutes ?? 0,
    quality: p.quality ?? 0,
  }));

  return (
    <div>
      <PageHeader
        title="Sleep & Recovery"
        subtitle="Rest is where progress happens"
        icon={Moon}
        action={
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Log sleep
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatTile title="Last night" value={fmtHours(chartData.at(-1)?.minutes)} icon={Clock} />
        <StatTile title="Average" value={fmtHours(trends?.average_minutes)} icon={Moon} />
        <StatTile
          title="Avg quality"
          value={
            chartData.length
              ? `${(chartData.reduce((a, c) => a + (c.quality || 0), 0) / chartData.length).toFixed(1)}/5`
              : '—'
          }
          icon={BatteryCharging}
        />
        <StatTile title="Nights logged" value={chartData.length} icon={Battery} />
      </div>

      {chartData.length === 0 ? (
        <EmptyState
          icon={Moon}
          title="No sleep logged yet"
          description="Log your first night to see trends. Consistency beats perfection."
        />
      ) : (
        <Card className="mb-6">
          <h3 className="font-semibold mb-4">Sleep duration — last {chartData.length} nights</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #e2e8f0)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number | string, name: string) =>
                    name === 'minutes' ? [fmtHours(Number(value)), 'Sleep'] : [value, 'Quality']
                  }
                />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="quality"
                  stroke="#a5b4fc"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card className="mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Recovery guidance</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{trends?.note}</p>
          </div>
        </div>
      </Card>

      {trends && trends.entries.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-3">Recent entries</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {trends.entries.slice(0, 7).map((e) => (
              <div key={e.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{e.date}</p>
                  {e.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{e.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <span>{fmtHours(e.total_minutes)}</span>
                  <span>Q {e.quality ?? '—'}/5</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log last night's sleep">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400">Bedtime</label>
              <Input
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                placeholder="23:00"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400">Wake time</label>
              <Input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                placeholder="07:00"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">
              Total sleep (minutes)
            </label>
            <Input
              type="number"
              value={totalMinutes}
              onChange={(e) => setTotalMinutes(Number(e.target.value))}
              min={0}
              max={1440}
            />
            <p className="text-xs text-slate-400 mt-1">{fmtHours(totalMinutes)}</p>
          </div>
          {(
            [
              ['Sleep quality', quality, setQuality],
              ['Energy on waking', energy, setEnergy],
              ['Soreness', soreness, setSoreness],
              ['Fatigue', fatigue, setFatigue],
            ] as [string, number, React.Dispatch<React.SetStateAction<number>>][]
          ).map(([label, val, setter]) => (
            <div key={label}>
              <label className="text-sm text-slate-600 dark:text-slate-400">
                {label} ({val}/5)
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={val}
                onChange={(e) => setter(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          ))}
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">Notes (optional)</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Woke up once..." />
          </div>
          <Button onClick={submit} disabled={submitting} className="w-full">
            {submitting ? 'Saving...' : 'Save entry'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default TrackSleep;
