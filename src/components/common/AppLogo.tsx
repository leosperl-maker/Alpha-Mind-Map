import React from 'react';
import logoHeader from '../../assets/Logo_Header__10_.png';

export const AppLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const height = size === 'sm' ? 24 : size === 'lg' ? 44 : 32;

  return (
    <img
      src={logoHeader}
      height={height}
      alt="Alpha Mind Map"
      style={{ display: 'block' }}
    />
  );
};
