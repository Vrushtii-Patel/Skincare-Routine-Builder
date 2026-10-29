import React from 'react';
import { BottleShape } from '../../types';

interface BottleProps {
  shape: BottleShape;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const BottleIllustration: React.FC<BottleProps> = ({
  shape,
  color = '#C496A1',
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-8 h-10',
    md: 'w-12 h-16',
    lg: 'w-16 h-22',
    xl: 'w-24 h-32',
  };

  const dim = sizeMap[size] || sizeMap.md;

  switch (shape) {
    case 'dropper':
      return (
        <svg
          viewBox="0 0 64 96"
          className={`${dim} ${className} transition-transform duration-300 hover:scale-105`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Dropper bulb */}
          <path
            d="M27 6C27 4.34315 28.3431 3 30 3H34C35.6569 3 37 4.34315 37 6V14H27V6Z"
            fill="#5A524D"
          />
          {/* Dropper cap collar */}
          <rect x="23" y="14" width="18" height="6" rx="2" fill="#FAF7F2" stroke="#5A524D" strokeWidth="1.5" />
          {/* Glass neck */}
          <rect x="26" y="20" width="12" height="5" fill="#FAF7F2" stroke="#5A524D" strokeWidth="1.5" />
          {/* Main glass body */}
          <rect
            x="14"
            y="25"
            width="36"
            height="58"
            rx="8"
            fill="#FAF7F2"
            stroke="#5A524D"
            strokeWidth="1.5"
          />
          {/* Serum liquid fill */}
          <rect
            x="16"
            y="42"
            width="32"
            height="39"
            rx="6"
            fill={color}
            fillOpacity="0.45"
          />
          {/* Minimalist label */}
          <rect
            x="20"
            y="46"
            width="24"
            height="26"
            rx="3"
            fill="#FFFFFF"
            stroke="#5A524D"
            strokeWidth="1"
          />
          <line x1="24" y1="53" x2="40" y2="53" stroke="#5A524D" strokeWidth="1" strokeLinecap="round" />
          <line x1="26" y1="58" x2="38" y2="58" stroke="#8A8079" strokeWidth="1" strokeLinecap="round" />
          {/* Dropper pipette inside */}
          <path d="M32 20V50" stroke="#8A8079" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2" />
          <circle cx="32" cy="51" r="1.5" fill="#8A8079" />
        </svg>
      );

    case 'tube':
      return (
        <svg
          viewBox="0 0 64 96"
          className={`${dim} ${className} transition-transform duration-300 hover:scale-105`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Tube crimp top */}
          <path
            d="M17 12H47V16H17V12Z"
            fill="#5A524D"
            stroke="#5A524D"
            strokeWidth="1.2"
          />
          {/* Tube body */}
          <path
            d="M17 16L21 68C21 72 23 74 27 75H37C41 74 43 72 43 68L47 16H17Z"
            fill={color}
            fillOpacity="0.4"
            stroke="#5A524D"
            strokeWidth="1.5"
          />
          {/* Minimalist label */}
          <rect
            x="24"
            y="30"
            width="16"
            height="24"
            rx="2"
            fill="#FFFFFF"
            stroke="#5A524D"
            strokeWidth="1"
          />
          <line x1="27" y1="36" x2="37" y2="36" stroke="#5A524D" strokeWidth="1" strokeLinecap="round" />
          <line x1="28" y1="41" x2="36" y2="41" stroke="#8A8079" strokeWidth="1" strokeLinecap="round" />
          {/* Flip cap bottom */}
          <rect
            x="24"
            y="76"
            width="16"
            height="14"
            rx="3"
            fill="#FAF7F2"
            stroke="#5A524D"
            strokeWidth="1.5"
          />
          <line x1="24" y1="83" x2="40" y2="83" stroke="#8A8079" strokeWidth="1" />
        </svg>
      );

    case 'jar':
      return (
        <svg
          viewBox="0 0 64 96"
          className={`${dim} ${className} transition-transform duration-300 hover:scale-105`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Jar cap lid */}
          <rect
            x="12"
            y="32"
            width="40"
            height="10"
            rx="3"
            fill="#5A524D"
            stroke="#5A524D"
            strokeWidth="1.5"
          />
          {/* Jar neck collar */}
          <rect x="16" y="42" width="32" height="4" fill="#FAF7F2" stroke="#5A524D" strokeWidth="1.2" />
          {/* Glass jar base */}
          <rect
            x="10"
            y="46"
            width="44"
            height="34"
            rx="8"
            fill="#FAF7F2"
            stroke="#5A524D"
            strokeWidth="1.5"
          />
          {/* Cream fill */}
          <rect
            x="12"
            y="52"
            width="40"
            height="26"
            rx="6"
            fill={color}
            fillOpacity="0.45"
          />
          {/* Round brand dot or label */}
          <circle cx="32" cy="64" r="7" fill="#FFFFFF" stroke="#5A524D" strokeWidth="1" />
          <line x1="28" y1="64" x2="36" y2="64" stroke="#8A8079" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );

    case 'pump':
    default:
      return (
        <svg
          viewBox="0 0 64 96"
          className={`${dim} ${className} transition-transform duration-300 hover:scale-105`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Pump nozzle */}
          <path
            d="M32 6H20C17 6 15 8 15 11C15 13 17 14 20 14H32V6Z"
            fill="#5A524D"
          />
          <path d="M16 11V15" stroke="#5A524D" strokeWidth="1.5" strokeLinecap="round" />
          {/* Pump stem */}
          <rect x="30" y="6" width="4" height="12" fill="#5A524D" />
          {/* Cap collar */}
          <rect x="22" y="16" width="20" height="7" rx="2" fill="#FAF7F2" stroke="#5A524D" strokeWidth="1.5" />
          {/* Bottle body */}
          <rect
            x="15"
            y="23"
            width="34"
            height="62"
            rx="7"
            fill="#FAF7F2"
            stroke="#5A524D"
            strokeWidth="1.5"
          />
          {/* Liquid fill */}
          <rect
            x="17"
            y="40"
            width="30"
            height="43"
            rx="5"
            fill={color}
            fillOpacity="0.4"
          />
          {/* Label */}
          <rect
            x="21"
            y="42"
            width="22"
            height="28"
            rx="2"
            fill="#FFFFFF"
            stroke="#5A524D"
            strokeWidth="1"
          />
          <line x1="25" y1="49" x2="39" y2="49" stroke="#5A524D" strokeWidth="1" strokeLinecap="round" />
          <line x1="26" y1="54" x2="38" y2="54" stroke="#8A8079" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );
  }
};

export const BotanicalTwig: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 38C16 32 26 22 38 10"
      stroke="#919D85"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M20 28C18 22 22 18 26 22C24 26 22 28 20 28Z"
      fill="#919D85"
      fillOpacity="0.5"
      stroke="#919D85"
      strokeWidth="1.2"
    />
    <path
      d="M28 20C32 16 36 20 32 24C28 22 28 20 28 20Z"
      fill="#919D85"
      fillOpacity="0.5"
      stroke="#919D85"
      strokeWidth="1.2"
    />
    <circle cx="38" cy="10" r="3" fill="#C496A1" fillOpacity="0.7" />
  </svg>
);

export const EssenceDroplet: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2.5C12 2.5 5 11 5 15.5C5 19.0899 8.13401 22 12 22C15.866 22 19 19.0899 19 15.5C19 11 12 2.5 12 2.5Z"
      fill="#C496A1"
      fillOpacity="0.3"
      stroke="#C496A1"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 14.5C9 13 11 10 11 10"
      stroke="#FAF7F2"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

