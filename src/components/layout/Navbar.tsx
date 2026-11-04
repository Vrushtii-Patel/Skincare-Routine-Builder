import React from 'react';
import { NavLink } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useStreak } from '../../hooks/useStreak';

export const Navbar: React.FC = () => {
  const profile = useStore((state) => state.profile);
  const { currentStreak, isTodayAmComplete, isTodayPmComplete } = useStreak();

  const navItems = [
    { to: '/today', label: 'Today' },
    { to: '/routine', label: 'Routine' },
    { to: '/week', label: 'Week Plan' },
    { to: '/shelf', label: 'Shelf' },
    { to: '/compatibility', label: 'Checker' },
    { to: '/settings', label: 'Profile' },
  ];

  return (
    <>
      {/* Desktop Top Navbar matching Landing Page */}
      <header className="sticky top-0 z-40 bg-white/65 backdrop-blur-xl border-b border-white/70 px-4 sm:px-8 py-3.5 transition-all shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <NavLink to="/today" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shadow-2xs group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 40 40" fill="currentColor" className="w-4.5 h-4.5">
                <path d="M20 0c1.2 11.5 8.5 18.8 20 20-11.5 1.2-18.8 8.5-20 20-1.2-11.5-8.5-18.8-20-20C11.5 18.8 18.8 11.5 20 0z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-cocoa-900 tracking-tight leading-tight">
                Skincare Ritual
              </span>
              <span className="text-[10px] uppercase tracking-widest text-cocoa-500 font-semibold">
                Routine Builder & Planner
              </span>
            </div>
          </NavLink>

          {/* Desktop Frosted Links Pill (No icons, matching landing page) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-white/75 backdrop-blur-md p-1.5 rounded-full border border-white/90 shadow-2xs">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-5 py-1.5 rounded-full text-[13.5px] transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#441F2E] to-[#2D141F] text-white shadow-xs font-semibold'
                      : 'text-cocoa-500 hover:text-cocoa-900 hover:bg-white/60 font-medium'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Streak Badge: Only show if user is onboarded AND has an active streak */}
          {profile.isOnboarded && currentStreak > 0 && (
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md transition-all bg-white/85 text-rose-800 border-rose-300 shadow-2xs"
                title={`${currentStreak} day streak. Today: AM ${isTodayAmComplete ? '✓' : '—'}, PM ${isTodayPmComplete ? '✓' : '—'}`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
                <span>{currentStreak}d streak</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-xl border-t border-white/80 px-2 py-2 flex items-center justify-around shadow-soft-lg">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-2xl text-[12px] transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#441F2E] to-[#2D141F] text-white font-semibold shadow-2xs'
                  : 'text-cocoa-500 hover:text-cocoa-900 font-medium'
              }`
            }
          >
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};
