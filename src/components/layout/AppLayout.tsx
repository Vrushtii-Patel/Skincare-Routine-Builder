import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { AppDisclaimerFooter } from '../safety/SafetyNotices';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-ivory text-cocoa-900 pb-20 md:pb-6">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <Outlet />
      </main>
      <AppDisclaimerFooter />
    </div>
  );
};

