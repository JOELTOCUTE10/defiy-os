import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-darkbg text-slate-900 dark:text-slate-100 transition-colors">
      <BottomNav />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <TopBar />
        <main className="max-w-6xl mx-auto px-4 pb-24 md:pb-8 pt-4 md:pt-6 w-full flex-1 flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
