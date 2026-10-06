import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Sparkles, Activity, Target, User } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/chat', label: 'AI', icon: Sparkles },
  { path: '/track', label: 'Track', icon: Activity },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/profile', label: 'Profile', icon: User },
];

export const BottomNav: React.FC = () => {
  return (
    <>
      {/* Mobile Fixed Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-darkcard/90 backdrop-blur-lg border-t border-slate-200/80 dark:border-darkborder px-2 py-2">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 text-xs font-medium ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400 font-semibold scale-105'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`p-1.5 rounded-xl transition-colors ${
                        isActive
                          ? 'bg-brand-500/10 dark:bg-brand-500/20'
                          : 'bg-transparent'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar Nav */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 w-64 bg-white dark:bg-darkcard border-r border-slate-200 dark:border-darkborder p-4">
        <div className="flex items-center gap-3 px-3 py-4 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-accent flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Defiy OS
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">AI Personal Life Coach</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-sm font-medium ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-darkborder">
          <NavLink
            to="/weekly-review"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`
            }
          >
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span>Weekly Review</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};
