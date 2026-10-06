import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Laptop, Zap, User as UserIcon, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { xpApi } from '../../api/endpoints';
import type { XPInfo } from '../../api/types';

const routeTitles: Record<string, string> = {
  '/': 'Home Dashboard',
  '/chat': 'AI Life Coach',
  '/track': 'Tracking Hub',
  '/track/fitness': 'Fitness & Workouts',
  '/track/nutrition': 'Nutrition Tracker',
  '/track/sleep': 'Sleep & Recovery',
  '/track/habits': 'Habit Tracker',
  '/goals': 'Goals & Milestones',
  '/school': 'School & Academics',
  '/notes': 'Notes & Knowledge',
  '/finance': 'Finance & Budget',
  '/wellbeing': 'Wellbeing & Mindset',
  '/profile': 'Profile & Settings',
  '/weekly-review': 'Weekly Review',
};

export const TopBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, profile, logout } = useAuth();
  const [xp, setXp] = useState<XPInfo | null>(null);

  useEffect(() => {
    let mounted = true;
    if (user) {
      xpApi
        .get()
        .then((data) => {
          if (mounted) setXp(data);
        })
        .catch(() => {
          // ignore or default
        });
    }
    return () => {
      mounted = false;
    };
  }, [user, location.pathname]);

  const getTitle = () => {
    if (routeTitles[location.pathname]) {
      return routeTitles[location.pathname];
    }
    if (location.pathname.startsWith('/goals/')) {
      return 'Goal Details';
    }
    return 'Defiy OS';
  };

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-darkbg/80 backdrop-blur-md border-b border-slate-200/80 dark:border-darkborder/80 px-4 py-3 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {getTitle()}
          </h1>
          {profile?.name && (
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Welcome back, {profile.name}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* XP Level Badge */}
          <div
            onClick={() => navigate('/profile')}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-brand-500/10 border border-amber-500/30 dark:border-amber-400/20 text-amber-700 dark:text-amber-300 font-semibold text-xs hover:scale-105 transition-all"
            title={`${xp?.points || 0} XP points`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Lvl {xp?.level || 1}</span>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-normal hidden sm:inline">
              ({xp?.points || 0} XP)
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={cycleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            title={`Current theme: ${theme}. Click to change.`}
            aria-label="Toggle theme"
          >
            {theme === 'light' && <Sun className="w-4 h-4" />}
            {theme === 'dark' && <Moon className="w-4 h-4" />}
            {theme === 'system' && <Laptop className="w-4 h-4" />}
          </button>

          {/* Profile Quick Link */}
          <button
            onClick={() => navigate('/profile')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            title="Profile & Settings"
            aria-label="Profile"
          >
            <UserIcon className="w-4 h-4" />
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors hidden sm:block"
            title="Log out"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
