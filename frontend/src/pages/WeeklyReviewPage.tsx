import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Dumbbell,
  BookOpen,
  CheckCircle2,
  Moon,
  Utensils,
  Target,
  TrendingUp,
  Award,
  AlertCircle,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { weeklyReviewApi } from '../api/endpoints';
import type { WeeklyReview } from '../api/types';
import { useToast } from '../hooks/useToast';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { StatTile } from '../components/ui/StatTile';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

export const WeeklyReviewPage: React.FC = () => {
  const { showToast } = useToast();
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchReview = async () => {
    setLoading(true);
    try {
      const res = await weeklyReviewApi.getLatest();
      setReview(res);
    } catch (err) {
      // If none found yet
      setReview(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await weeklyReviewApi.generate();
      setReview(res);
      showToast('Weekly review generated successfully!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to generate weekly review.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const d = review?.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly Executive Review"
        description="A comprehensive summary of your performance, habits, and growth over the past week."
        action={
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Latest Review</span>
              </>
            )}
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        </div>
      ) : !review ? (
        <Card className="p-8 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            No Review Generated Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate your first weekly retrospective to see insights, workout totals, study hours,
            and habit trends.
          </p>
          <Button variant="primary" onClick={handleGenerate} disabled={generating}>
            Generate Weekly Review Now
          </Button>
        </Card>
      ) : (
        <>
          {/* Executive Summary Card */}
          <Card className="p-6 bg-gradient-to-tr from-brand-600/10 via-brand-500/5 to-transparent border-brand-500/20">
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>AI Executive Summary</span>
            </div>
            <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed font-medium">
              {review.summary || 'Your weekly habits and activities have been recorded.'}
            </p>
            {review.week_start && (
              <p className="text-xs text-slate-400 mt-3 font-mono">
                Week starting: {new Date(review.week_start).toLocaleDateString()}
              </p>
            )}
          </Card>

          {/* Stat Tiles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile
              title="Workouts Logged"
              value={d?.workouts_completed ?? 0}
              description="Completed sessions"
              icon={Dumbbell}
              color="emerald"
            />
            <StatTile
              title="Study Time"
              value={`${d?.study_minutes ?? 0} mins`}
              description="Total focus time"
              icon={BookOpen}
              color="blue"
            />
            <StatTile
              title="Habit Completion"
              value={`${d?.habit_pct ?? 0}%`}
              description="Consistency rating"
              icon={CheckCircle2}
              color="teal"
            />
            <StatTile
              title="Average Sleep"
              value={`${d?.sleep_avg_hours ?? 0} hrs`}
              description="Per night"
              icon={Moon}
              color="purple"
            />
            <StatTile
              title="Nutrition Days"
              value={`${d?.nutrition_logging_days ?? 0} / 7`}
              description="Days logged"
              icon={Utensils}
              color="amber"
            />
            <StatTile
              title="Goal Progress"
              value={`+${d?.goal_progress_delta ?? 0}%`}
              description="Progress gain"
              icon={Target}
              color="indigo"
            />
            <StatTile
              title="Savings Delta"
              value={`+$${d?.savings_delta ?? 0}`}
              description="Saved this week"
              icon={TrendingUp}
              color="brand"
            />
          </div>

          {/* Deep Dives Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Accomplishment */}
            <Card className="p-5 border-t-4 border-t-emerald-500">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100 mb-2">
                <Award className="w-5 h-5 text-emerald-500" />
                <span>Biggest Victory</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {d?.accomplishment || 'Consistent logging across core domains.'}
              </p>
            </Card>

            {/* Areas to Improve */}
            <Card className="p-5 border-t-4 border-t-amber-500">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <span>Area to Improve</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {d?.areas_to_improve || 'Aim for higher hydration and sleep consistency.'}
              </p>
            </Card>

            {/* Next Week Focus */}
            <Card className="p-5 border-t-4 border-t-brand-500">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100 mb-2">
                <Target className="w-5 h-5 text-brand-500" />
                <span>Next Week Focus</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {d?.next_week_focus || 'Maintain workout momentum and complete upcoming study milestones.'}
              </p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
