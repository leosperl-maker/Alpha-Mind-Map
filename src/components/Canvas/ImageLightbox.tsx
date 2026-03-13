import React, { useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';

export const ImageLightbox: React.FC = () => {
  const lightboxImage = useUIStore(s => s.lightboxImage);
  const setLightboxImage = useUIStore(s => s.setLightboxImage);

  useEffect(() => {
    if (!lightboxImage) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxImage, setLightboxImage]);

  if (!lightboxImage) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={() => setLightboxImage(null)}
    >
      <img
        src={lightboxImage}
        alt="Full size"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '90vw', maxHeight: '90vh',
          objectFit: 'contain', borderRadius: 8,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      />
      <button
        onClick={() => setLightboxImage(null)}
        style={{
          position: 'absolute', top: 20, right: 20,
          background: 'rgba(255,255,255,0.15)', border: 'none',
          borderRadius: '50%', width: 44, height: 44,
          color: '#fff', fontSize: 22, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Fermer (Echap)"
      >×</button>
    </div>
  );
};
