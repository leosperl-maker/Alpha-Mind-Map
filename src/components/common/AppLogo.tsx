import React from 'react';

export const AppLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const height = size === 'sm' ? 24 : size === 'lg' ? 44 : 32;

  return (
    <img
      src={`${import.meta.env.BASE_URL}Logo_Header__10_.png`}
      height={height}
      alt="Alpha Mind Map"
      style={{ display: 'block' }}
    />
  );
};
