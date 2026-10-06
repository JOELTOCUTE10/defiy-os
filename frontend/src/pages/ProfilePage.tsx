import React, { useEffect, useState } from 'react';
import {
  User,
  Settings,
  Sun,
  Moon,
  Laptop,
  Bell,
  Sparkles,
  LogOut,
  Zap,
  Check,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { profileApi, notificationsApi } from '../api/endpoints';
import type { NotificationStatus } from '../api/types';
import { useToast } from '../hooks/useToast';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

const MAIN_GOALS_OPTIONS = [
  { id: 'fitness', label: 'Fitness & Physical Health' },
  { id: 'school', label: 'School & Academics' },
  { id: 'finance', label: 'Finance & Wealth' },
  { id: 'habits', label: 'Habits & Routine' },
  { id: 'wellbeing', label: 'Mental Wellbeing' },
];

const EQUIPMENT_OPTIONS = [
  { id: 'gym', label: 'Full Gym' },
  { id: 'dumbbells', label: 'Dumbbells' },
  { id: 'bodyweight', label: 'Bodyweight Only' },
  { id: 'resistance_bands', label: 'Bands' },
];

export const ProfilePage: React.FC = () => {
  const { user, profile, logout, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [savingProfile, setSavingProfile] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [ageRange, setAgeRange] = useState('25-34');
  const [mainGoals, setMainGoals] = useState<string[]>([]);
  const [fitnessExperience, setFitnessExperience] = useState('intermediate');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [schedule, setSchedule] = useState('flexible');
  const [sleepPrefs, setSleepPrefs] = useState('7-8 hours');
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');

  // Settings Toggles
  const [xpEnabled, setXpEnabled] = useState(true);
  const [smartReminders, setSmartReminders] = useState(true);

  // Status Cards
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setAgeRange(profile.age_range || '25-34');
      setMainGoals(profile.main_goals || ['fitness', 'school']);
      setFitnessExperience(profile.fitness_experience || 'intermediate');
      setEquipment(profile.equipment || ['gym']);
      setSchedule(profile.schedule || 'flexible');
      setSleepPrefs(profile.sleep_prefs || '7-8 hours');
      setUnits(profile.units || 'metric');
    }
  }, [profile]);

  useEffect(() => {
    notificationsApi
      .getStatus()
      .then((res) => setNotificationStatus(res))
      .catch(() => setNotificationStatus(null));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await profileApi.update({
        name,
        age_range: ageRange,
        main_goals: mainGoals,
        fitness_experience: fitnessExperience,
        equipment,
        schedule,
        sleep_prefs: sleepPrefs,
        units,
        onboarded: true,
      });
      await refreshProfile();
      showToast('Profile updated successfully!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      showToast(msg, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleMainGoal = (goalId: string) => {
    setMainGoals((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    );
  };

  const toggleEquipment = (eqId: string) => {
    setEquipment((prev) =>
      prev.includes(eqId) ? prev.filter((e) => e !== eqId) : [...prev, eqId]
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Profile & Settings"
        subtitle="Manage your personal preferences, goals, and system configurations."
      />

      {/* SECTION 1: PROFILE FORM */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-darkborder pb-4">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Personal Information
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user?.email ? `Account email: ${user.email}` : 'Customize your AI coach context.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Display Name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Select
              label="Age Range"
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
              options={[
                { value: '18-24', label: '18 - 24 years' },
                { value: '25-34', label: '25 - 34 years' },
                { value: '35-44', label: '35 - 44 years' },
                { value: '45-54', label: '45 - 54 years' },
                { value: '55+', label: '55+ years' },
              ]}
            />
          </div>

          {/* Main Focus Goals Multi-Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Main Focus Goals
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MAIN_GOALS_OPTIONS.map((g) => {
                const isSelected = mainGoals.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleMainGoal(g.id)}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                        : 'border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>{g.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Fitness Experience"
              value={fitnessExperience}
              onChange={(e) => setFitnessExperience(e.target.value)}
              options={[
                { value: 'beginner', label: 'Beginner' },
                { value: 'intermediate', label: 'Intermediate' },
                { value: 'advanced', label: 'Advanced' },
              ]}
            />

            <Select
              label="Daily Schedule Preference"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              options={[
                { value: 'morning', label: 'Morning Person' },
                { value: 'afternoon', label: 'Afternoon Active' },
                { value: 'evening', label: 'Evening / Night' },
                { value: 'flexible', label: 'Flexible / Varied' },
              ]}
            />
          </div>

          {/* Equipment Checkboxes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Available Fitness Equipment
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EQUIPMENT_OPTIONS.map((eq) => {
                const isSelected = equipment.includes(eq.id);
                return (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => toggleEquipment(eq.id)}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                        : 'border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>{eq.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <Input
            label="Sleep Preferences"
            placeholder="e.g. 7-8 hours, early bird"
            value={sleepPrefs}
            onChange={(e) => setSleepPrefs(e.target.value)}
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" loading={savingProfile}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* SECTION 2: PREFERENCES & SETTINGS */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-darkborder pb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              App Preferences
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Appearance, units, and notification settings.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Theme Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Appearance Theme
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                  theme === 'light'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                  theme === 'dark'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                  theme === 'system'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-400'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Measurement Units */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Measurement Units
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUnits('metric')}
                className={`p-3 rounded-2xl border text-xs font-semibold transition-all ${
                  units === 'metric'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-400'
                }`}
              >
                Metric (kg, km, ml)
              </button>

              <button
                type="button"
                onClick={() => setUnits('imperial')}
                className={`p-3 rounded-2xl border text-xs font-semibold transition-all ${
                  units === 'imperial'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-400'
                }`}
              >
                Imperial (lbs, miles, oz)
              </button>
            </div>
          </div>

          {/* XP & Gamification Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-darkborder">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  XP & Achievements System
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Earn points and level up by completing habits and study sessions.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setXpEnabled(!xpEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none ${
                xpEnabled ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  xpEnabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Smart Reminders Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-darkborder">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Smart Reminders
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Receive intelligent prompts for study sessions and workouts.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSmartReminders(!smartReminders)}
              className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none ${
                smartReminders ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  smartReminders ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* SECTION 3: SYSTEM & AI STATUS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Notification Status Card */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
              <Bell className="w-4 h-4 text-brand-500" />
              <span>Notification Provider</span>
            </div>
            {notificationStatus?.is_connected ? (
              <span className="flex items-center gap-1 text-xs text-emerald-500 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                <XCircle className="w-4 h-4" /> Not Connected
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {notificationStatus?.is_connected
              ? `Provider ${notificationStatus.provider} is active.`
              : 'Push notification provider is currently not connected on the server. Scheduled reminders will remain local to your session.'}
          </p>
        </Card>

        {/* AI Engine Status Card */}
        <Card className="p-5 space-y-3 bg-gradient-to-tr from-brand-500/10 via-brand-500/5 to-transparent border-brand-500/20">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span>AI Engine Status</span>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
            AI engine status: set GEMINI_API_KEY on the server to enable full AI coaching
          </p>
        </Card>
      </div>

      {/* SECTION 4: ACCOUNT & LOGOUT */}
      <Card className="p-6 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Sign Out</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Log out of your current session on this device.
          </p>
        </div>

        <Button variant="danger" onClick={logout} className="flex items-center gap-1.5">
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </Button>
      </Card>
    </div>
  );
};
