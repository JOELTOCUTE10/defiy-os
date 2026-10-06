import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './hooks/useToast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { Skeleton } from './components/ui/Skeleton';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { ChatPage } from './pages/ChatPage';
import { TrackHub } from './pages/TrackHub';
import { TrackFitness } from './pages/TrackFitness';
import { TrackNutrition } from './pages/TrackNutrition';
import { TrackSleep } from './pages/TrackSleep';
import { TrackHabits } from './pages/TrackHabits';
import { GoalsPage } from './pages/GoalsPage';
import { GoalDetailPage } from './pages/GoalDetailPage';
import { SchoolPage } from './pages/SchoolPage';
import { NotesPage } from './pages/NotesPage';
import { FinancePage } from './pages/FinancePage';
import { WellbeingPage } from './pages/WellbeingPage';
import { ProfilePage } from './pages/ProfilePage';
import { WeeklyReviewPage } from './pages/WeeklyReviewPage';

const FullScreenLoader: React.FC = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-darkbg flex items-center justify-center">
    <div className="w-full max-w-md space-y-4 px-6">
      <Skeleton className="h-10 w-48 mx-auto" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
};

const RequireOnboarding: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading, profile } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!token) return <Navigate to="/login" replace />;
  if (!profile?.onboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
};

const RedirectIfAuthed: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route
      path="/login"
      element={
        <RedirectIfAuthed>
          <AuthPage />
        </RedirectIfAuthed>
      }
    />
    <Route
      path="/onboarding"
      element={
        <RequireAuth>
          <OnboardingPage />
        </RequireAuth>
      }
    />
    <Route
      path="/"
      element={
        <RequireOnboarding>
          <AppShell />
        </RequireOnboarding>
      }
    >
      <Route index element={<HomePage />} />
      <Route path="chat" element={<ChatPage />} />
      <Route path="track" element={<TrackHub />} />
      <Route path="track/fitness" element={<TrackFitness />} />
      <Route path="track/nutrition" element={<TrackNutrition />} />
      <Route path="track/sleep" element={<TrackSleep />} />
      <Route path="track/habits" element={<TrackHabits />} />
      <Route path="goals" element={<GoalsPage />} />
      <Route path="goals/:id" element={<GoalDetailPage />} />
      <Route path="school" element={<SchoolPage />} />
      <Route path="notes" element={<NotesPage />} />
      <Route path="finance" element={<FinancePage />} />
      <Route path="wellbeing" element={<WellbeingPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="weekly-review" element={<WeeklyReviewPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
