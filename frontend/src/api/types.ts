export interface User {
  id: string;
  email: string;
  created_date?: string;
}

export interface Profile {
  id?: string;
  user_id?: string;
  name?: string;
  age_range?: string;
  main_goals?: string[];
  fitness_experience?: string;
  equipment?: string[];
  schedule?: string;
  school_work?: string;
  sleep_prefs?: string;
  finance_goals?: string[];
  notification_prefs?: Record<string, any>;
  units?: 'metric' | 'imperial';
  onboarded: boolean;
  created_date?: string;
  updated_date?: string;
}

export interface Quote {
  quote: string;
  author: string;
  category?: string;
}

export interface DashboardData {
  greeting: string;
  quote: Quote;
  focus_list: string[];
  stats: {
    today_workout: string | null;
    upcoming_reminders_count: number;
    school_tasks_due_count: number;
    calories_today: number;
    calories_target: number;
    last_sleep_hours: number | null;
    goals_progress_pct: number;
    habit_completion_pct: number;
    xp_info: {
      level: number;
      points: number;
    };
  };
}

export interface ChatAction {
  action: string;
  args: Record<string, any>;
  label?: string;
  status?: 'pending' | 'executed' | 'failed';
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant';
  content: string;
  created_date?: string;
  actions?: ChatAction[];
  flags?: {
    no_engine?: boolean;
    [key: string]: any;
  };
}

export interface Conversation {
  id: string;
  user_id?: string;
  title: string;
  created_date?: string;
  updated_date?: string;
  messages?: ChatMessage[];
}

export interface ChatResponse {
  message: ChatMessage;
  actions_executed?: any[];
  flags?: {
    no_engine?: boolean;
    [key: string]: any;
  };
}

export interface MealAnalysisResult {
  title: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    is_estimate: boolean;
  }>;
  total_calories: number;
  notes?: string;
  is_estimate: boolean;
}

export interface GoalMilestone {
  id: string;
  user_id?: string;
  goal_id: string;
  name: string;
  target_value: number;
  completed: boolean;
  completed_date?: string | null;
}

export interface Goal {
  id: string;
  user_id?: string;
  name: string;
  category: string;
  target_value?: number | null;
  current_value: number;
  unit?: string | null;
  deadline?: string | null;
  status: 'active' | 'completed' | 'paused';
  notes?: string | null;
  milestones?: GoalMilestone[];
  created_date?: string;
  updated_date?: string;
}

export interface Exercise {
  id: string;
  user_id?: string;
  name: string;
  muscle_groups: string[];
  equipment: string[];
  category: string;
  instructions?: string | null;
  is_ai_generated: boolean;
}

export interface WorkoutSet {
  id?: string;
  user_id?: string;
  workout_exercise_id?: string;
  set_number: number;
  reps: number;
  weight: number;
  rir?: number | null;
  duration_seconds?: number | null;
  completed: boolean;
}

export interface WorkoutExercise {
  id?: string;
  user_id?: string;
  workout_id?: string;
  exercise_id?: string | null;
  name: string;
  order_index: number;
  target_sets: number;
  target_reps: number;
  target_weight: number;
  target_rir?: number | null;
  rest_seconds?: number | null;
  notes?: string | null;
  sets?: WorkoutSet[];
}

export interface Workout {
  id: string;
  user_id?: string;
  title: string;
  date: string;
  status: 'planned' | 'completed' | 'skipped';
  duration_minutes: number;
  source: 'manual' | 'ai';
  plan_data?: Record<string, any> | null;
  notes?: string | null;
  exercises?: WorkoutExercise[];
  created_date?: string;
}

export interface PersonalRecord {
  id: string;
  user_id?: string;
  exercise_name: string;
  metric: 'weight' | 'reps' | 'duration';
  value: number;
  unit: string;
  workout_id?: string | null;
  date: string;
}

export interface FitnessStats {
  volume_by_week: Array<{ week: string; volume: number }>;
  prs: PersonalRecord[];
  consistency: Array<{ date: string; completed: boolean }>;
}

export interface MealItem {
  id?: string;
  user_id?: string;
  meal_id?: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  micronutrients?: Record<string, any> | null;
  is_estimate: boolean;
}

export interface Meal {
  id: string;
  user_id?: string;
  title: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string;
  source: 'manual' | 'photo' | 'ai';
  photo_url?: string | null;
  confirmed: boolean;
  notes?: string | null;
  items?: MealItem[];
  created_date?: string;
}

export interface DailyNutrition {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  meals: Meal[];
}

export interface WeeklyNutritionStats {
  days: Array<{
    date: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }>;
}

export interface HydrationEntry {
  id: string;
  user_id?: string;
  date: string;
  ml: number;
}

export interface NutritionPatterns {
  patterns: string[];
  caution_note: string;
}

export interface SleepEntry {
  id: string;
  user_id?: string;
  date: string;
  bedtime?: string | null;
  wake_time?: string | null;
  total_minutes?: number | null;
  quality?: number | null;
  energy?: number | null;
  soreness?: number | null;
  fatigue?: number | null;
  notes?: string | null;
}

export interface SleepTrendPoint {
  date: string;
  minutes: number | null;
  quality: number | null;
  energy: number | null;
  soreness: number | null;
  fatigue: number | null;
}

export interface SleepTrends {
  entries: SleepEntry[];
  average_minutes: number | null;
  trend: SleepTrendPoint[];
  note: string;
}

export interface Habit {
  id: string;
  user_id?: string;
  name: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly' | string;
  target_per_week: number;
  active: boolean;
  done_today: boolean;
  streak: number;
  week_done: number;
  week_pct: number;
  last_30_days: number;
  created_date?: string;
  updated_date?: string;
}

export interface HabitCompletion {
  done: boolean;
  date: string;
}

export interface HabitProgress {
  completion_pct: number;
  done_today: number;
  total: number;
}

export interface SchoolClass {
  id: string;
  user_id?: string;
  name: string;
  teacher?: string | null;
  schedule?: string | null;
  color?: string | null;
}

export interface Assignment {
  id: string;
  user_id?: string;
  class_id?: string | null;
  title: string;
  type: 'homework' | 'project' | 'test' | 'quiz';
  due_date: string;
  status: 'pending' | 'completed';
  notes?: string | null;
}

export interface StudySession {
  id: string;
  user_id?: string;
  assignment_id?: string | null;
  class_id?: string | null;
  topic: string;
  date: string;
  minutes: number;
  notes?: string | null;
  completed: boolean;
}

export interface SchoolSummary {
  total_classes: number;
  pending_assignments: number;
  study_minutes_this_week: number;
}

export interface Note {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  category: string;
  favorite: boolean;
  tags?: string[];
  created_date?: string;
  updated_date?: string;
}

export interface FinanceEntry {
  id: string;
  user_id?: string;
  kind: 'income' | 'expense' | 'savings';
  amount: number;
  category: string;
  description?: string | null;
  date: string;
}

export interface SavingsGoal {
  id: string;
  user_id?: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string | null;
  status: 'active' | 'completed';
  notes?: string | null;
}

export interface FinanceSummary {
  total_income: number;
  total_expenses: number;
  total_savings: number;
  categories: Array<{ category: string; amount: number }>;
}

export interface MoodEntry {
  id: string;
  user_id?: string;
  date: string;
  mood: number;
  stress: number;
  journal?: string | null;
  tags?: string[];
}

export interface WellbeingTrends {
  mood_avg: number;
  stress_avg: number;
  recent_entries: MoodEntry[];
}

export interface Reminder {
  id: string;
  user_id?: string;
  title: string;
  description?: string | null;
  remind_at: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  repeat_day?: number | null;
  notify_minutes_before: number;
  category: string;
  completed: boolean;
  notification_status: 'pending' | 'sent' | 'not_connected';
}

export interface NotificationStatus {
  status: string;
  provider: string;
  is_connected: boolean;
}

export interface XPEvent {
  id: string;
  user_id?: string;
  points: number;
  reason: string;
  source_type: string;
  source_id?: string | null;
  created_date?: string;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  points_required?: number | null;
  earned?: boolean;
  earned_date?: string | null;
}

export interface XPInfo {
  level: number;
  points: number;
  next_level_at: number;
  achievements: Achievement[];
  recent_events: XPEvent[];
}

export interface WeeklyReviewData {
  workouts_completed?: number;
  study_minutes?: number;
  habit_pct?: number;
  sleep_avg_hours?: number;
  nutrition_logging_days?: number;
  goal_progress_delta?: number;
  savings_delta?: number;
  accomplishment?: string;
  areas_to_improve?: string;
  next_week_focus?: string;
}

export interface WeeklyReview {
  id?: string;
  user_id?: string;
  week_start?: string;
  data?: WeeklyReviewData;
  summary?: string;
  created_date?: string;
}

export interface AIRecommendation {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  action_type: string;
  payload: Record<string, any>;
  status: 'pending' | 'accepted' | 'dismissed';
}
