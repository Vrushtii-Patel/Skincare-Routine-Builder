import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BotanicalTwig } from '../components/skincare/SkincareIllustrations';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 space-y-4">
      <BotanicalTwig className="w-12 h-12 text-sage-600 animate-pulse" />
      <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-cocoa-900">
        Page Not Found
      </h1>
      <p className="text-xs sm:text-sm text-cocoa-500 max-w-sm">
        The skincare page or routine you are looking for does not exist.
      </p>
      <Link to="/today" className="btn-primary text-xs inline-flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Today's Routine</span>
      </Link>
    </div>
  );
};
