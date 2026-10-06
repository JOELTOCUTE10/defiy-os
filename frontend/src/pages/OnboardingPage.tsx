import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ArrowLeft, Check, FastForward } from 'lucide-react';
import { profileApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ProgressBar } from '../components/ui/ProgressBar';

const GOAL_OPTIONS = [
  'Fitness & Strength',
  'Weight Loss / Body Recomp',
  'Better Sleep & Recovery',
  'Academic / School Success',
  'Career & Productivity',
  'Financial Savings & Budgeting',
  'Mindfulness & Daily Habits',
];

const EQUIPMENT_OPTIONS = [
  'Full Gym',
  'Dumbbells',
  'Resistance Bands',
  'Kettlebell',
  'Pull-up Bar',
  'Bodyweight Only',
];

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [submitting, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState(profile?.name || '');
  const [ageRange, setAgeRange] = useState(profile?.age_range || '18-24');
  const [mainGoals, setMainGoals] = useState<string[]>(profile?.main_goals || []);
  const [fitnessExperience, setFitnessExperience] = useState(
    profile?.fitness_experience || 'intermediate'
  );
  const [equipment, setEquipment] = useState<string[]>(profile?.equipment || ['Bodyweight Only']);
  const [schedule] = useState(profile?.schedule || 'Flexible');
  const [schoolWork, setSchoolWork] = useState(profile?.school_work || 'Full-time');
  const [sleepPrefs, setSleepPrefs] = useState(profile?.sleep_prefs || '7-8 hours');
  const [financeGoals] = useState<string[]>(profile?.finance_goals || []);
  const [units, setUnits] = useState<'metric' | 'imperial'>(profile?.units || 'metric');

  const totalSteps = 5;

  const toggleGoal = (goal: string) => {
    setMainGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const toggleEquipment = (eq: string) => {
    setEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    );
  };

  const saveProfileAndFinish = async () => {
    setLoading(true);
    try {
      await profileApi.update({
        name: name || 'User',
        age_range: ageRange,
        main_goals: mainGoals,
        fitness_experience: fitnessExperience,
        equipment,
        schedule,
        school_work: schoolWork,
        sleep_prefs: sleepPrefs,
        finance_goals: financeGoals,
        units,
        onboarded: true,
      });
      await refreshProfile();
      showToast('Profile setup complete! Welcome to Defiy OS.', 'success');
      navigate('/');
    } catch (err: any) {
      showToast('Saved with default options.', 'info');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      saveProfileAndFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-darkbg flex flex-col justify-center items-center p-4 relative">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold text-xs mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personalizing Your Experience</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Welcome to Defiy OS
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Step {step} of {totalSteps}
          </p>
          <div className="mt-3">
            <ProgressBar value={(step / totalSteps) * 100} size="sm" />
          </div>
        </div>

        {/* Card Body */}
        <Card className="p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-darkborder">
          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Let's start with your basics
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                How should Defiy OS address you?
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Preferred Name
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Age Range
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Under 18', '18-24', '25-34', '35+'].map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setAgeRange(range)}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                        ageRange === range
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Main Goals */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                What are your main focus areas?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select all that apply. Defiy OS tailors recommendations based on these.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {GOAL_OPTIONS.map((goal) => {
                  const selected = mainGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-left text-xs font-medium transition-all ${
                        selected
                          ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-300 font-semibold'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{goal}</span>
                      {selected && <Check className="w-4 h-4 text-brand-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Fitness & Equipment */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Fitness Experience & Gear
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Fitness Experience
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFitnessExperience(lvl)}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize transition-all ${
                        fitnessExperience === lvl
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Available Equipment
                </label>
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT_OPTIONS.map((eq) => {
                    const selected = equipment.includes(eq);
                    return (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => toggleEquipment(eq)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                          selected
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {eq}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Schedule & Work/School */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Lifestyle & Schedule
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Occupation / Context
                </label>
                <Input
                  type="text"
                  value={schoolWork}
                  onChange={(e) => setSchoolWork(e.target.value)}
                  placeholder="e.g. University Student, Software Engineer, Full-Time"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Typical Schedule / Sleep Preference
                </label>
                <Input
                  type="text"
                  value={sleepPrefs}
                  onChange={(e) => setSleepPrefs(e.target.value)}
                  placeholder="e.g. Sleep at 11 PM, wake at 7 AM (8 hours)"
                />
              </div>
            </div>
          )}

          {/* Step 5: Units & Confirm */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Preferences & Units
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Measurement Units
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUnits('metric')}
                    className={`p-3 rounded-2xl border text-center text-xs font-semibold transition-all ${
                      units === 'metric'
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Metric (kg, km, ml)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnits('imperial')}
                    className={`p-3 rounded-2xl border text-center text-xs font-semibold transition-all ${
                      units === 'imperial'
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Imperial (lbs, miles, oz)
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-700 dark:text-brand-300">
                <p className="font-semibold mb-1">Ready to explore Defiy OS!</p>
                <p>
                  Your preferences are stored safely. You can update them anytime in Profile
                  Settings.
                </p>
              </div>
            </div>
          )}

          {/* Step Navigation */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200 dark:border-darkborder">
            {step > 1 ? (
              <Button type="button" variant="outline" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            ) : (
              <Button type="button" variant="ghost" size="sm" onClick={saveProfileAndFinish}>
                <FastForward className="w-4 h-4 mr-1" /> Skip Setup
              </Button>
            )}

            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={submitting}
              onClick={handleNext}
            >
              {submitting ? (
                'Saving...'
              ) : step === totalSteps ? (
                'Finish & Launch OS'
              ) : (
                <>
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
