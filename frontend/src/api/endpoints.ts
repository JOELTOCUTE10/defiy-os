import { api } from './client';
import type {
  User,
  Profile,
  Quote,
  DashboardData,
  Conversation,
  ChatMessage,
  ChatResponse,
  MealAnalysisResult,
  Goal,
  GoalMilestone,
  Exercise,
  Workout,
  PersonalRecord,
  FitnessStats,
  Meal,
  DailyNutrition,
  WeeklyNutritionStats,
  HydrationEntry,
  NutritionPatterns,
  SleepEntry,
  SleepTrends,
  Habit,
  HabitCompletion,
  HabitProgress,
  SchoolClass,
  Assignment,
  StudySession,
  SchoolSummary,
  Note,
  FinanceEntry,
  SavingsGoal,
  FinanceSummary,
  MoodEntry,
  WellbeingTrends,
  Reminder,
  NotificationStatus,
  XPInfo,
  WeeklyReview,
  AIRecommendation,
} from './types';

export const authApi = {
  register: (body: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/register', body),
  login: (body: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/login', body),
  me: () => api.get<User>('/auth/me'),
};

export const profileApi = {
  get: () => api.get<Profile>('/profile'),
  update: (body: Partial<Profile>) => api.put<Profile>('/profile', body),
};

export const quotesApi = {
  today: () => api.get<Quote>('/quotes/today'),
};

export const dashboardApi = {
  get: () => api.get<DashboardData>('/dashboard'),
};

export const chatApi = {
  getConversations: () => api.get<Conversation[]>('/chat/conversations'),
  createConversation: (title?: string) =>
    api.post<Conversation>('/chat/conversations', { title }),
  deleteConversation: (id: string) =>
    api.del<{ success: boolean }>(`/chat/conversations/${id}`),
  getMessages: (conversationId: string) =>
    api.get<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`),
  sendMessage: (
    conversationId: string,
    content: string,
    source: 'text' | 'voice' = 'text'
  ) =>
    api.post<ChatResponse>(`/chat/conversations/${conversationId}/messages`, {
      content,
      source,
    }),
  analyzeMeal: (conversationId: string, photoBase64: string) =>
    api.post<MealAnalysisResult>(
      `/chat/conversations/${conversationId}/analyze-meal`,
      { photo_base64: photoBase64 }
    ),
};

export const goalsApi = {
  list: () => api.get<Goal[]>('/goals'),
  create: (body: Partial<Goal>) => api.post<Goal>('/goals', body),
  get: (id: string) => api.get<Goal>(`/goals/${id}`),
  update: (id: string, body: Partial<Goal>) => api.patch<Goal>(`/goals/${id}`, body),
  delete: (id: string) => api.del(`/goals/${id}`),
  listMilestones: (goalId: string) =>
    api.get<GoalMilestone[]>(`/goals/${goalId}/milestones`),
  addMilestone: (goalId: string, body: { name: string; target_value: number }) =>
    api.post<GoalMilestone>(`/goals/${goalId}/milestones`, body),
  updateMilestone: (
    goalId: string,
    milestoneId: string,
    body: Partial<GoalMilestone>
  ) =>
    api.patch<GoalMilestone>(
      `/goals/${goalId}/milestones/${milestoneId}`,
      body
    ),
  deleteMilestone: (goalId: string, milestoneId: string) =>
    api.del(`/goals/${goalId}/milestones/${milestoneId}`),
  updateProgress: (goalId: string, delta: number) =>
    api.post<Goal>(`/goals/${goalId}/progress`, { delta }),
};

export const fitnessApi = {
  listExercises: () => api.get<Exercise[]>('/fitness/exercises'),
  createExercise: (body: Partial<Exercise>) =>
    api.post<Exercise>('/fitness/exercises', body),
  listWorkouts: () => api.get<Workout[]>('/fitness/workouts'),
  createWorkout: (body: Partial<Workout>) =>
    api.post<Workout>('/fitness/workouts', body),
  updateWorkout: (id: string, body: Partial<Workout>) =>
    api.patch<Workout>(`/fitness/workouts/${id}`, body),
  generateWorkout: (params: {
    goal: string;
    experience: string;
    equipment: string[];
    minutes: number;
    days_per_week: number;
  }) => api.post<Workout>('/fitness/workouts/generate', params),
  getRecords: () => api.get<PersonalRecord[]>('/fitness/records'),
  getStats: () => api.get<FitnessStats>('/fitness/stats'),
};

export const nutritionApi = {
  listMeals: () => api.get<Meal[]>('/nutrition/meals'),
  createMeal: (body: Partial<Meal>) => api.post<Meal>('/nutrition/meals', body),
  getMeal: (id: string) => api.get<Meal>(`/nutrition/meals/${id}`),
  updateMeal: (id: string, body: Partial<Meal>) =>
    api.patch<Meal>(`/nutrition/meals/${id}`, body),
  deleteMeal: (id: string) => api.del(`/nutrition/meals/${id}`),
  getDaily: (date?: string) =>
    api.get<DailyNutrition>(
      `/nutrition/daily${date ? `?date=${encodeURIComponent(date)}` : ''}`
    ),
  getWeekly: () => api.get<WeeklyNutritionStats>('/nutrition/weekly'),
  addHydration: (ml: number) =>
    api.post<HydrationEntry>('/nutrition/hydrate', { ml }),
  getPatterns: () => api.get<NutritionPatterns>('/nutrition/patterns'),
};

export const sleepApi = {
  listEntries: () => api.get<SleepEntry[]>('/sleep/entries'),
  createEntry: (body: Partial<SleepEntry>) =>
    api.post<SleepEntry>('/sleep/entries', body),
  getTrends: () => api.get<SleepTrends>('/sleep/trends'),
};

export const habitsApi = {
  list: () => api.get<Habit[]>('/habits'),
  create: (body: Partial<Habit>) => api.post<Habit>('/habits', body),
  update: (id: string, body: Partial<Habit>) =>
    api.patch<Habit>(`/habits/${id}`, body),
  delete: (id: string) => api.del(`/habits/${id}`),
  complete: (id: string, date?: string) =>
    api.post<HabitCompletion>(`/habits/${id}/complete`, { date }),
  removeCompletion: (id: string, date: string) =>
    api.del(`/habits/${id}/complete/${date}`),
  getProgress: () => api.get<HabitProgress>('/habits/progress'),
};

export const schoolApi = {
  listClasses: () => api.get<SchoolClass[]>('/school/classes'),
  createClass: (body: Partial<SchoolClass>) =>
    api.post<SchoolClass>('/school/classes', body),
  listAssignments: () => api.get<Assignment[]>('/school/assignments'),
  createAssignment: (body: Partial<Assignment>) =>
    api.post<Assignment>('/school/assignments', body),
  updateAssignment: (id: string, body: Partial<Assignment>) =>
    api.patch<Assignment>(`/school/assignments/${id}`, body),
  listStudySessions: () => api.get<StudySession[]>('/school/sessions'),
  createStudySession: (body: Partial<StudySession>) =>
    api.post<StudySession>('/school/sessions', body),
  getSummary: () => api.get<SchoolSummary>('/school/summary'),
};

export const notesApi = {
  list: (params?: { q?: string; favorite?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set('q', params.q);
    if (params?.favorite !== undefined)
      searchParams.set('favorite', String(params.favorite));
    const query = searchParams.toString();
    return api.get<Note[]>(`/notes${query ? `?${query}` : ''}`);
  },
  create: (body: Partial<Note>) => api.post<Note>('/notes', body),
  get: (id: string) => api.get<Note>(`/notes/${id}`),
  update: (id: string, body: Partial<Note>) =>
    api.patch<Note>(`/notes/${id}`, body),
  delete: (id: string) => api.del(`/notes/${id}`),
  toggleFavorite: (id: string) => api.post<Note>(`/notes/${id}/favorite`),
};

export const financeApi = {
  listEntries: () => api.get<FinanceEntry[]>('/finance/entries'),
  createEntry: (body: Partial<FinanceEntry>) =>
    api.post<FinanceEntry>('/finance/entries', body),
  listSavingsGoals: () => api.get<SavingsGoal[]>('/finance/savings-goals'),
  createSavingsGoal: (body: Partial<SavingsGoal>) =>
    api.post<SavingsGoal>('/finance/savings-goals', body),
  contributeSavingsGoal: (id: string, amount: number) =>
    api.post<SavingsGoal>(`/finance/savings-goals/${id}/contribute`, {
      amount,
    }),
  getSummary: () => api.get<FinanceSummary>('/finance/summary'),
};

export const wellbeingApi = {
  listEntries: () => api.get<MoodEntry[]>('/wellbeing/entries'),
  createEntry: (body: Partial<MoodEntry>) =>
    api.post<MoodEntry>('/wellbeing/entries', body),
  getTrends: () => api.get<WellbeingTrends>('/wellbeing/trends'),
};

export const remindersApi = {
  list: () => api.get<Reminder[]>('/reminders'),
  create: (body: Partial<Reminder>) => api.post<Reminder>('/reminders', body),
  update: (id: string, body: Partial<Reminder>) =>
    api.patch<Reminder>(`/reminders/${id}`, body),
  delete: (id: string) => api.del(`/reminders/${id}`),
  complete: (id: string) => api.post<Reminder>(`/reminders/${id}/complete`),
};

export const notificationsApi = {
  getStatus: () => api.get<NotificationStatus>('/notifications/status'),
  registerToken: (body: { token: string; platform: string }) =>
    api.post('/notifications/register-token', body),
};

export const xpApi = {
  get: () => api.get<XPInfo>('/xp'),
};

export const weeklyReviewApi = {
  getLatest: () => api.get<WeeklyReview>('/weekly-review'),
  generate: () => api.post<WeeklyReview>('/weekly-review'),
};

export const recommendationsApi = {
  listPending: () => api.get<AIRecommendation[]>('/recommendations'),
  accept: (id: string) => api.post(`/recommendations/${id}/accept`),
  dismiss: (id: string) => api.post(`/recommendations/${id}/dismiss`),
};
