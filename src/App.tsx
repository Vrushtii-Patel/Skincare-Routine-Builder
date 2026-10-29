import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { AppLayout } from './components/layout/AppLayout';
import { Welcome } from './pages/Welcome';
import { Quiz } from './pages/Quiz';
import { Today } from './pages/Today';
import { Routine } from './pages/Routine';
import { Shelf } from './pages/Shelf';
import { Week } from './pages/Week';
import { Compatibility } from './pages/Compatibility';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';

export const App: React.FC = () => {
  const isOnboarded = useStore((state) => state.profile.isOnboarded);

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={
          isOnboarded ? <Navigate to="/today" replace /> : <Navigate to="/welcome" replace />
        }
      />

      {/* Onboarding pages */}
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/quiz" element={<Quiz />} />

      {/* Main app wrapped in editorial layout */}
      <Route element={<AppLayout />}>
        <Route path="/today" element={<Today />} />
        <Route path="/routine" element={<Routine />} />
        <Route path="/shelf" element={<Shelf />} />
        <Route path="/week" element={<Week />} />
        <Route path="/compatibility" element={<Compatibility />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* 404 handler */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

