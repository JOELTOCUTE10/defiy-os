import React from 'react';
import {
  Dumbbell,
  Utensils,
  Target,
  GraduationCap,
  Moon,
  CheckCircle2,
  Bell,
  Sparkles,
} from 'lucide-react';

export interface PromptItem {
  id: string;
  category: string;
  title: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const defaultPrompts: PromptItem[] = [
  {
    id: 'workout',
    category: 'Fitness',
    title: 'Generate a Workout',
    prompt: 'Generate a 30-minute bodyweight workout for intermediate level',
    icon: Dumbbell,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    id: 'nutrition',
    category: 'Nutrition',
    title: 'Log a Meal',
    prompt: 'Log lunch: Grilled chicken salad with olive oil and avocado',
    icon: Utensils,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  {
    id: 'goals',
    category: 'Goals',
    title: 'Milestone Breakdown',
    prompt: 'Help me break down my goal to save $1,000 into actionable milestones',
    icon: Target,
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  },
  {
    id: 'school',
    category: 'Academics',
    title: 'Study Planner',
    prompt: 'Create an optimal 3-day study plan for my Math exam next week',
    icon: GraduationCap,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 'sleep',
    category: 'Sleep',
    title: 'Log Sleep',
    prompt: 'Log last night sleep: 7.5 hours, slept at 11pm, woke at 6:30am, quality 4/5',
    icon: Moon,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  },
  {
    id: 'habits',
    category: 'Habits',
    title: 'Habit Review',
    prompt: 'Show my habit progress for this week and give me consistency tips',
    icon: CheckCircle2,
    color: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
  },
  {
    id: 'reminder',
    category: 'Reminders',
    title: 'Set Reminder',
    prompt: 'Remind me tomorrow at 9 AM to submit the project assignment',
    icon: Bell,
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  },
  {
    id: 'weekly',
    category: 'Coach',
    title: 'Weekly Insight',
    prompt: 'Summarize my key achievements across fitness, sleep, and finance this week',
    icon: Sparkles,
    color: 'text-brand-500 bg-brand-500/10 border-brand-500/20',
  },
];

interface SuggestedPromptsProps {
  onSelectPrompt: (promptText: string) => void;
}

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onSelectPrompt }) => {
  return (
    <div className="py-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-brand-500" />
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Suggested Prompts
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {defaultPrompts.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPrompt(item.prompt)}
              className="flex flex-col text-left p-3.5 rounded-2xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder hover:border-brand-500 dark:hover:border-brand-500 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                  {item.category}
                </span>
                <div
                  className={`p-1.5 rounded-xl border ${item.color} group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {item.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                "{item.prompt}"
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
