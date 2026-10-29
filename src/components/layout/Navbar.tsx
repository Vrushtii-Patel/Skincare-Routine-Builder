import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Calendar,
  Sparkles,
  Layers,
  Settings,
  Flame,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useStreak } from '../../hooks/useStreak';
import { BotanicalTwig } from '../skincare/SkincareIllustrations';

export const Navbar: React.FC = () => {
  const { currentStreak, isTodayAmComplete, isTodayPmComplete } = useStreak();

  const navItems = [
    { to: '/today', label: 'Today', icon: Sparkles },
    { to: '/routine', label: 'Routine', icon: CheckCircle2 },
    { to: '/week', label: 'Week Plan', icon: Calendar },
    { to: '/shelf', label: 'Shelf', icon: Layers },
    { to: '/compatibility', label: 'Checker', icon: ShieldCheck },
    { to: '/settings', label: 'Profile', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Top Navbar */}
      <header className="sticky top-0 z-40 bg-ivory/85 backdrop-blur-md border-b border-cream-200/80 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <NavLink to="/today" className="flex items-center gap-3 group focus:outline-none">
            <BotanicalTwig className="w-7 h-7 text-sage-600 transition-transform group-hover:rotate-6" />
            <div className="flex flex-col">
              <span className="font-editorial text-lg sm:text-xl font-semibold tracking-tight text-cocoa-900 leading-tight">
                Skincare Journal
              </span>
              <span className="text-[10px] uppercase tracking-widest text-cocoa-400 font-medium">
                Routine Builder & Planner
              </span>
            </div>
          </NavLink>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-1 bg-cream-100/70 p-1.5 rounded-full border border-cream-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-cocoa-600 hover:text-cocoa-900 hover:bg-cream-200/60'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Streak Badge & Status */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                currentStreak > 0
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-cream-100 text-cocoa-500 border-cream-200'
              }`}
              title={`${currentStreak} day streak. Today: AM ${isTodayAmComplete ? '✓' : '—'}, PM ${isTodayPmComplete ? '✓' : '—'}`}
            >
              <Flame
                className={`w-4 h-4 ${
                  currentStreak > 0 ? 'text-rose-500 fill-rose-400 animate-pulse' : 'text-cocoa-400'
                }`}
              />
              <span>{currentStreak}d streak</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-ivory/95 backdrop-blur-lg border-t border-cream-200 px-2 py-2 flex items-center justify-around shadow-soft-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl text-[11px] font-medium transition-all ${
                  isActive
                    ? 'text-rose-600 font-semibold'
                    : 'text-cocoa-500 hover:text-cocoa-800'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};
