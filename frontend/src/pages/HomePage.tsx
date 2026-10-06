import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Dumbbell,
  Bell,
  GraduationCap,
  Utensils,
  Moon,
  Target,
  CheckCircle2,
  Zap,
  Quote as QuoteIcon,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { dashboardApi } from '../api/endpoints';
import type { DashboardData } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { StatTile } from '../components/ui/StatTile';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.get();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Time-aware greeting fallback
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center space-y-4">
        <p className="text-rose-500 font-semibold text-sm">{error}</p>
        <Button variant="primary" onClick={fetchDashboard}>
          <RefreshCw className="w-4 h-4 mr-2" /> Retry Loading
        </Button>
      </Card>
    );
  }

  const greetingText = data?.greeting || `${getTimeGreeting()}, ${profile?.name || 'User'}`;
  const quote = data?.quote;
  const focusList = data?.focus_list || [];
  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* Hero Greeting Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-brand-accent to-indigo-700 p-6 sm:p-8 text-white shadow-xl shadow-brand-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-200 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Defiy OS Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {greetingText}
            </h1>
            <p className="text-sm text-brand-100 mt-1 max-w-lg">
              Here is your personal life cockpit for today. All systems operational.
            </p>
          </div>

          <button
            onClick={() => navigate('/chat')}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-brand-700 font-bold text-sm shadow-lg hover:bg-brand-50 hover:scale-105 transition-all self-start md:self-auto"
          >
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Talk to Defiy AI</span>
          </button>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Quote of the Day */}
      {quote && (
        <Card className="p-5 border-l-4 border-l-brand-500 bg-gradient-to-r from-brand-500/5 to-transparent">
          <div className="flex items-start gap-3">
            <QuoteIcon className="w-6 h-6 text-brand-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm italic font-medium text-slate-800 dark:text-slate-200">
                "{quote.quote}"
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                — {quote.author}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Today's Focus List */}
      {focusList.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-500" />
              Today's Key Focus Areas
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {focusList.length} priorities
            </span>
          </div>
          <div className="space-y-2.5">
            {focusList.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-darkborder text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                <span className="w-6 h-6 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center shrink-0 text-xs">
                  {idx + 1}
                </span>
                <span className="mt-0.5 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Stat Cards Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <span>Life Metrics & Status</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Today's Workout */}
          <Link to="/track/fitness">
            <StatTile
              title="Today's Workout"
              value={stats?.today_workout ? 'Planned' : 'Rest / Open'}
              description={stats?.today_workout || 'Click to schedule or log a workout'}
              icon={Dumbbell}
              color="emerald"
            />
          </Link>

          {/* 2. Upcoming Reminders */}
          <Link to="/chat">
            <StatTile
              title="Reminders Due"
              value={stats?.upcoming_reminders_count ?? 0}
              description="Pending action items"
              icon={Bell}
              color="amber"
            />
          </Link>

          {/* 3. School Tasks */}
          <Link to="/school">
            <StatTile
              title="School Assignments"
              value={stats?.school_tasks_due_count ?? 0}
              description="Tasks due soon"
              icon={GraduationCap}
              color="indigo"
            />
          </Link>

          {/* 4. Nutrition */}
          <Link to="/track/nutrition">
            <StatTile
              title="Calories Today"
              value={`${stats?.calories_today ?? 0} / ${stats?.calories_target ?? 2000}`}
              description="Target kcal"
              icon={Utensils}
              color="brand"
            />
          </Link>

          {/* 5. Sleep */}
          <Link to="/track/sleep">
            <StatTile
              title="Sleep Last Night"
              value={stats?.last_sleep_hours ? `${stats.last_sleep_hours} hrs` : 'Not Logged'}
              description="Recovery score"
              icon={Moon}
              color="purple"
            />
          </Link>

          {/* 6. Goals Progress */}
          <Link to="/goals">
            <Card className="p-5 flex flex-col justify-between hover:border-brand-500 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Goals Overall
                </span>
                <Target className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {stats?.goals_progress_pct ?? 0}%
                </p>
                <div className="mt-2">
                  <ProgressBar value={stats?.goals_progress_pct ?? 0} size="sm" />
                </div>
              </div>
            </Card>
          </Link>

          {/* 7. Habit Progress */}
          <Link to="/track/habits">
            <Card className="p-5 flex flex-col justify-between hover:border-brand-500 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Habits Today
                </span>
                <CheckCircle2 className="w-5 h-5 text-teal-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {stats?.habit_completion_pct ?? 0}%
                </p>
                <div className="mt-2">
                  <ProgressBar value={stats?.habit_completion_pct ?? 0} size="sm" />
                </div>
              </div>
            </Card>
          </Link>

          {/* 8. XP & Level */}
          <Link to="/profile">
            <StatTile
              title="Level & Experience"
              value={`Level ${stats?.xp_info?.level ?? 1}`}
              description={`${stats?.xp_info?.points ?? 0} Total XP Earned`}
              icon={Zap}
              color="amber"
            />
          </Link>
        </div>
      </div>

      {/* AI Assistant Callout */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold">Need assistance or goal advice?</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Defiy AI can schedule workouts, create study plans, or log meals by voice or text.
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/chat')}
          className="shrink-0 flex items-center gap-2"
        >
          <span>Open AI Coach</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Card>
    </div>
  );
};
