import React, { useEffect, useState } from 'react';
import {
  HeartHandshake,
  MessageSquare,
  Sparkles,
  PhoneCall,
  Smile,
  AlertCircle,
  Calendar,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { wellbeingApi } from '../api/endpoints';
import type { MoodEntry, WellbeingTrends } from '../api/types';
import { useToast } from '../hooks/useToast';
import { PageHeader } from '../components/ui/PageHeader';
import { StatTile } from '../components/ui/StatTile';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Skeleton } from '../components/ui/Skeleton';
import { Chip } from '../components/ui/Chip';

const MOOD_OPTIONS = [
  { value: 1, label: 'Very Low', emoji: '😞' },
  { value: 2, label: 'Low', emoji: '🙁' },
  { value: 3, label: 'Neutral', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '🙂' },
  { value: 5, label: 'Great', emoji: '😄' },
];

const STRESS_OPTIONS = [
  { value: 1, label: 'Very Low', emoji: '😌' },
  { value: 2, label: 'Low', emoji: '🙂' },
  { value: 3, label: 'Moderate', emoji: '😐' },
  { value: 4, label: 'High', emoji: '😟' },
  { value: 5, label: 'Very High', emoji: '😫' },
];

export const WellbeingPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState<WellbeingTrends | null>(null);
  const [entries, setEntries] = useState<MoodEntry[]>([]);

  // Check-in Form State
  const [selectedMood, setSelectedMood] = useState<number>(3);
  const [selectedStress, setSelectedStress] = useState<number>(3);
  const [journalText, setJournalText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWellbeingData = async () => {
    setLoading(true);
    try {
      const [trendsRes, entriesRes] = await Promise.all([
        wellbeingApi.getTrends().catch(() => null),
        wellbeingApi.listEntries().catch(() => []),
      ]);

      if (trendsRes) setTrends(trendsRes);
      setEntries(entriesRes || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load wellbeing data';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWellbeingData();
  }, []);

  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await wellbeingApi.createEntry({
        mood: selectedMood,
        stress: selectedStress,
        journal: journalText.trim() || undefined,
        date: new Date().toISOString().split('T')[0],
      });
      showToast('Mood check-in recorded!', 'success');
      setJournalText('');
      fetchWellbeingData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record check-in';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const chartData = (trends?.recent_entries ?? entries)
    .slice()
    .reverse()
    .map((e) => ({
      date: new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      Mood: e.mood,
      Stress: e.stress,
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wellbeing & Mindset"
        subtitle="Daily reflection, emotional check-ins, and stress monitoring."
        action={
          <Button
            variant="primary"
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Talk to my AI coach</span>
          </Button>
        }
      />

      {/* Supportive Disclaimer Banner */}
      <Card className="p-4 bg-brand-500/10 border-brand-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <HeartHandshake className="w-5 h-5 text-brand-500 shrink-0" />
          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium">
            supportive, never judgmental; I am not a therapist
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/chat')}
          className="shrink-0 flex items-center gap-1.5"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Talk to my AI coach</span>
        </Button>
      </Card>

      {/* Crisis Note Card */}
      <Card className="p-4 bg-rose-500/10 border-rose-500/30 flex items-center gap-3">
        <PhoneCall className="w-5 h-5 text-rose-500 shrink-0" />
        <div className="text-xs text-rose-700 dark:text-rose-300 font-semibold">
          In a crisis (US), call or text 988.
        </div>
      </Card>

      {/* Mood Check-In Form Card */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Smile className="w-5 h-5 text-brand-500" />
            <span>How are you feeling today?</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        <form onSubmit={handleSubmitCheckIn} className="space-y-6">
          {/* Mood Scale 1-5 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Mood Rating (1 = Very Low, 5 = Great)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {MOOD_OPTIONS.map((opt) => {
                const isSelected = selectedMood === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedMood(opt.value)}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/30 font-bold'
                        : 'border-slate-200 dark:border-darkborder hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stress Scale 1-5 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Stress Level (1 = Relaxed, 5 = Very High)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {STRESS_OPTIONS.map((opt) => {
                const isSelected = selectedStress === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedStress(opt.value)}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30 font-bold'
                        : 'border-slate-200 dark:border-darkborder hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Journal Textarea */}
          <Textarea
            label="Daily Journal Reflection (Optional)"
            rows={3}
            placeholder="What's on your mind today? Write down any thoughts, victories, or stressors..."
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
          />

          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={submitting}>
              Log Daily Check-In
            </Button>
          </div>
        </form>
      </Card>

      {/* Summary Tiles & Trends Line Chart */}
      <div className="space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          <span>Wellbeing Trends</span>
        </h3>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatTile
              title="Average Mood"
              value={trends?.mood_avg ? `${trends.mood_avg.toFixed(1)} / 5` : 'N/A'}
              subtitle="Recent mood score"
              icon={Smile}
              iconColor="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
            />
            <StatTile
              title="Average Stress"
              value={trends?.stress_avg ? `${trends.stress_avg.toFixed(1)} / 5` : 'N/A'}
              subtitle="Recent stress score"
              icon={AlertCircle}
              iconColor="text-amber-500 bg-amber-50 dark:bg-amber-500/10"
            />
          </div>
        )}

        {/* Recharts Trends Chart */}
        <Card className="p-6">
          {loading ? (
            <Skeleton className="h-56 rounded-2xl" />
          ) : chartData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs text-slate-400">
              No trend history recorded yet. Complete daily check-ins to track mood and stress over time.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="Mood"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Stress"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* History Journal Log */}
      <div className="space-y-3">
        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
          Reflection History
        </h3>

        {loading ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : entries.length === 0 ? (
          <p className="text-xs text-slate-400">No journal entries logged yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <Card key={entry.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Chip variant="success" size="sm">
                      Mood: {entry.mood}/5
                    </Chip>
                    <Chip variant="warning" size="sm">
                      Stress: {entry.stress}/5
                    </Chip>
                  </div>
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                </div>

                {entry.journal && (
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap pt-1">
                    {entry.journal}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
