import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { useMapStore } from '../../store/mapStore';

export const FocusModeBanner: React.FC = () => {
  const focusModeNodeId = useUIStore(s => s.focusModeNodeId);
  const setFocusMode = useUIStore(s => s.setFocusMode);
  const maps = useMapStore(s => s.maps);
  const activeMapId = useMapStore(s => s.activeMapId);

  if (!focusModeNodeId) return null;

  const map = maps.find(m => m.id === activeMapId);
  const node = map?.nodes[focusModeNodeId];
  const nodeName = node?.content.text || 'Nœud';

  return (
    <div style={{
      position: 'fixed',
      top: 64,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 120,
      background: '#6C5CE7',
      color: '#fff',
      borderRadius: 24,
      padding: '7px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: '0 4px 16px rgba(108,92,231,0.35)',
      fontSize: 13,
      fontWeight: 600,
      pointerEvents: 'all',
    }}>
      <span style={{ opacity: 0.8 }}>🔍 Mode Focus</span>
      <span style={{ opacity: 0.6, fontSize: 11 }}>—</span>
      <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nodeName}</span>
      <button
        onClick={() => setFocusMode(null)}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          borderRadius: 12,
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          padding: '2px 10px',
          marginLeft: 4,
          lineHeight: 1.6,
        }}
        title="Quitter le mode focus (Echap)"
      >
        Quitter
      </button>
    </div>
  );
};
