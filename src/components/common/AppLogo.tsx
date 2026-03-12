import React from 'react';

export const AppLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const iconSize = size === 'sm' ? 26 : size === 'lg' ? 48 : 34;
  const textSize = size === 'sm' ? 13 : size === 'lg' ? 22 : 16;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size === 'lg' ? 14 : 10 }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" fill="none">
        <defs>
          <clipPath id="logo-clip-shared">
            <circle cx="50" cy="50" r="50" />
          </clipPath>
        </defs>
        <circle cx="50" cy="50" r="50" fill="#7C5CE7" />
        <polygon points="50,3 90.7,73.5 9.3,73.5" fill="white" opacity="0.18" clipPath="url(#logo-clip-shared)" />
        <line x1="50" y1="3" x2="90.7" y2="73.5" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip-shared)" />
        <line x1="90.7" y1="26.5" x2="50" y2="97" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip-shared)" />
        <line x1="90.7" y1="73.5" x2="9.3" y2="73.5" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip-shared)" />
        <line x1="50" y1="97" x2="9.3" y2="26.5" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip-shared)" />
        <line x1="9.3" y1="73.5" x2="50" y2="3" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip-shared)" />
        <line x1="9.3" y1="26.5" x2="90.7" y2="26.5" stroke="white" strokeWidth="4" strokeLinecap="round" clipPath="url(#logo-clip-shared)" />
      </svg>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, lineHeight: 1 }}>
        <span style={{ fontSize: textSize, fontWeight: 900, color: '#111', fontFamily: '"Arial Black", "Helvetica Neue", Arial, sans-serif', letterSpacing: '0.5px' }}>
          ALPHA&nbsp;
        </span>
        <span style={{ fontSize: textSize, fontWeight: 900, color: '#7C5CE7', fontFamily: '"Arial Black", "Helvetica Neue", Arial, sans-serif', letterSpacing: '0.5px' }}>
          MIND&nbsp;
        </span>
        <span style={{ fontSize: textSize, fontWeight: 900, color: '#111', fontFamily: '"Arial Black", "Helvetica Neue", Arial, sans-serif', letterSpacing: '0.5px' }}>
          MAP
        </span>
      </div>
    </div>
  );
};
