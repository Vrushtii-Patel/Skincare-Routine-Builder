import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { AppDisclaimerFooter } from '../safety/SafetyNotices';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden pb-20 md:pb-8">
      {/* Ambient dewy light spheres matching the landing page atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-[34rem] h-[34rem] rounded-full bg-rose-200/35 blur-3xl" />
        <div className="absolute top-1/4 -right-32 w-[32rem] h-[32rem] rounded-full bg-lavender-200/30 blur-3xl" />
        <div className="absolute bottom-12 left-1/3 w-[30rem] h-[30rem] rounded-full bg-rose-100/40 blur-3xl" />
      </div>

      {/* Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <div className="relative z-10">
        <AppDisclaimerFooter />
      </div>
    </div>
  );
};
